import Vue from 'vue';
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		settings: {},
		settingTemplates: {},
		settingCategories: {},
		mqtt: null,
		loggedInUser: false,
		fullScreen: false,
		minimized: false,
		uiConnected: false,
		mqttMessage: {}
	},
	mutations: {
		setSettings(state, settings) {
			state.settings = settings
		},
		setSettingTemplates(state, templates) {
			state.settingTemplates = templates
		},
		setSettingCategories(state, categories) {
			state.settingCategories = categories
		},
		setMqtt(state, client) {
			state.mqtt = client
		},
		mqttMessage(state, msg) {
			state.mqttMessage = msg
		},
		userLogin(state, user) {
			state.loggedInUser = user
		},
		userLogout(state) {
			state.loggedInUser = {}
			localStorage.removeItem('username')
			localStorage.removeItem('apiToken')
		},
		startCinemaMode(state) {
			state.fullScreen = true
			localStorage.setItem('fullscreen', state.fullScreen)
		},
		stopCinemaMode(state) {
			state.fullScreen = false
			localStorage.setItem('fullscreen', state.fullScreen)
		},
		toggleCinemaMode(state) {
			state.fullScreen = !state.fullScreen
			localStorage.setItem('fullscreen', state.fullScreen)
		},
		startMinimized(state) {
			state.minimized = true
			localStorage.setItem('minimized', state.minimized)
		},
		stopMinimized(state) {
			state.minimized = false
			localStorage.setItem('minimized', state.minimized)
		},
		toggleMinimized(state) {
			state.minimized = !state.minimized
			localStorage.setItem('minimized', state.minimized)
		},
		uiConnected(state, connected) {
			state.uiConnected = connected
		}
	}
})
