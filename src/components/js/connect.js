import axios from 'axios';
import Paho from 'paho-mqtt';

export default {
	name: 'connect',
	data() {
		return {
			connecting: false,
			port: 5001,
			ip: '',
			remember: false
		}
	},
	created: function () {
		this.ip = localStorage.getItem('host') || '127.0.0.1'
		this.port = localStorage.getItem('apiPort') || 5001
		this.doConnect()
	},
	methods: {
		doConnect() {
			this.connecting = true
			let self = this
			this.connect().then(() => {
				this.connectMQTT().then(() => {
					this.loadI18n().then(() => {
						this.validateToken().then(() => {
							self.$store.commit('uiConnected', true)
							self.$router.replace('/').then()
						})
					}).catch(reason => {
						console.error(reason)
					})
				}).catch(reason => {
					console.error(reason)
				})
			}).catch(reason => {
				console.error(reason)
			}).finally(() => self.connecting = false)
		},
		connect() {
			let self = this
			return new Promise(function(resolve, reject) {
				axios({
					method: 'get',
					url: `http://${self.ip}:${self.port}/api/v1.0.1/utils/config/`,
					headers: {'auth': localStorage.getItem('apiToken')}
				}).then(response => {
					self.$store.commit('setSettings', response.data.config)
					self.$store.commit('setSettingTemplates', response.data.templates)
					self.$store.commit('setSettingCategories', response.data.categories)
					if (self.remember) {
						localStorage.setItem('host', self.ip)
						localStorage.setItem('apiPort', self.port)
					}
					resolve()
				}).catch(reason => {
					self.ip = ''
					reject(new Error('Error connecting to Alice ' + reason))
				})
			})
		},
		connectMQTT() {
			let self = this
			return new Promise(function(resolve, reject) {
				axios.get(`http://${self.ip}:${self.port}/api/v1.0.1/utils/mqttConfig/`)
					.then(response => {
						let randomNum = Math.floor((Math.random() * 10000000) + 1);
						let client = new Paho.Client(response.data.host, Number(response.data.port), 'ProjectAliceInterface' + randomNum)
						client.onMessageArrived = self.onMessage
						client.onConnectionLost = self.onConnectionLost
						client.onConnectionFailed = self.onConnectionFailed
						client.connect({
							onSuccess: self.onConnected,
							onFailure: self.onConnectionFailed,
							timeout: 5
						})
						self.$store.commit('setMqtt', client)
						resolve()
					})
					.catch(reason => {
						reject(new Error('Error getting MQTT info: ' + reason))
					})
			})
		},
		validateToken() {
			let self = this
			return new Promise(function(resolve, reject) {
				if (localStorage.getItem('apiToken') && localStorage.getItem('username')) {
					axios({
						method: 'post',
						url: `http://${self.ip}:${self.port}/api/v1.0.1/login/checkToken/`,
						headers: {'auth': localStorage.getItem('apiToken')}
					}).then(response => {
						if ('success' in response.data) {
							self.$store.commit('userLogin', {
								user: localStorage.getItem('username'),
								token: localStorage.getItem('apiToken'),
								authLevel: response.data.authLevel
							})
						} else {
							localStorage.removeItem('username')
							localStorage.removeItem('apiToken')
						}
					}).finally(() => resolve())
				} else {
					resolve()
				}
			})
		},
		loadI18n() {
			let self = this
			return new Promise(function(resolve, reject) {
				axios.get(`http://${self.ip}:${self.port}/api/v1.0.1/utils/i18n/`)
					.then(response => {
						const i18n = self.$store.state.i18n
						for (const [lang, data] of Object.entries(response.data['data'])) {
							i18n.setLocaleMessage(lang, data)
						}
						self.$store.commit('setI18n', i18n)
						resolve()
					})
					.catch(reason => {
						reject(Error('Failed loading i18n: ' + reason))
					})
			})
		},
		onMessage: function (msg) {
			this.$store.commit('mqttMessage', msg)
		},
		onConnected: function () {
			console.log('Mqtt connected')
			this.$store.state.mqtt.subscribe('projectalice/devices/resourceUsage')
			this.$store.state.mqtt.subscribe('projectalice/logging/syslog')
			this.$store.state.mqtt.subscribe('projectalice/logging/alicewatch')
		},
		onConnectionFailed: function (_msg) {
			console.log('Mqtt connection failed')
		},
		onConnectionLost: function () {
			console.log('Mqtt connection lost')
		}
	}
}
