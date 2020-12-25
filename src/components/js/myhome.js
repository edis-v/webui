import axios from 'axios'
import MoveableItem from './moveableItem'

export default {
	name: 'myhome',
	data: function () {
		return {
			me: '',
			menuItems: [
				{
					name: this.$t('tooltips.edit'),
					icon: 'fas fa-pen-square',
					isToggle: true,
					extendedIcon: 'fas fa-times-circle',
					extendedName: this.$t('tooltips.close'),
					onClose: this.closeEditor
				},
				{
					name: this.$t('tooltips.theaterMode'),
					icon: 'fas fa-person-booth',
					isToggle: true,
					callback: this.cinemaMode
				},
				{
					name: this.$t('tooltips.manageLocations'),
					icon: 'fas fa-map-marked-alt',
					callback: this.setLocationsEditMode
				},
				{
					name: this.$t('tooltips.manageDevices'),
					icon: 'fas fa-plug',
					callback: this.setDevicesEditMode
				}
			],
			moveableItem: new MoveableItem(this, this.locations),
			locationsEditMode: false,
			devicesEditMode: false,
			toolsState: {
				addingLocation: false,
				paintingFloors: false,
				deletingLocations: false,
				addingDevice: false,
				deletingDevices: false,
				settingDevices: false,
				linkingDevices: false,
				settingLocations: false,
				placingFurniture: false,
				placingConstructions: false
			},
			newLocationName: '',
			locations: {},
			constructions: {},
			furnitures: {},
			devices: {},
			floorTiles: [],
			furnitureTiles: [],
			constructionTiles: [],
			activeFloorTile: '',
			activeFurnitureTile: '',
			activeConstructionTile: '',
			zoomLevel: 1.0,
			areaSelectorX: 0,
			areaSelectorY: 0,
			areaSelectorStartX: 0,
			areaSelectorStartY: 0,
			areaSelectorW: 0,
			areaSelectorH: 0,
			clicked: false,
			dragging: false,
			draggingPlan: false,
			draggingPlanStartX: 0,
			draggingPlanStartY: 0,
			floorPlanX: 0,
			floorPlanY: 0
		}
	},
	created: function() {
		this.me = this
		let self = this;
		document.addEventListener('keyup', function (event) {
			if (event.key === 'Enter') {
				if (self.$store.state.fullScreen) {
					self.$store.commit('stopCinemaMode')
				}
			} else if (event.key === 'Escape') {
				self.activeConstructionTile = ''
				self.activeFurnitureTile = ''
				self.activeFloorTile = ''
				this.setActiveTool('dummy')
			}
		})

		document.addEventListener('wheel', function (event) {
			if (event.deltaY > 1) {
				self.zoomLevel = Math.max(self.zoomLevel - 0.05, 0.1)
			} else {
				self.zoomLevel = Math.min(self.zoomLevel + 0.05, 3.0)
			}

			self.moveableItem.destroyMoveable()
		})

		axios({
			method: 'get',
			url: `http://${this.$store.state.settings['aliceIp']}:${this.$store.state.settings['apiPort']}/api/v1.0.1/myHome/locations/floors/`,
			headers: {'auth': localStorage.getItem('apiToken')}
		}).then(response => {
			if ('data' in response.data) {
				this.floorTiles = response.data.data
			}
		})

		axios({
			method: 'get',
			url: `http://${this.$store.state.settings['aliceIp']}:${this.$store.state.settings['apiPort']}/api/v1.0.1/myHome/furniture/tiles/`,
			headers: {'auth': localStorage.getItem('apiToken')}
		}).then(response => {
			if ('data' in response.data) {
				this.furnitureTiles = response.data.data
			}
		})

		axios({
			method: 'get',
			url: `http://${this.$store.state.settings['aliceIp']}:${this.$store.state.settings['apiPort']}/api/v1.0.1/myHome/constructions/tiles/`,
			headers: {'auth': localStorage.getItem('apiToken')}
		}).then(response => {
			if ('data' in response.data) {
				this.constructionTiles = response.data.data
			}
		})

		axios({
			method: 'get',
			url: `http://${this.$store.state.settings['aliceIp']}:${this.$store.state.settings['apiPort']}/api/v1.0.1/myHome/`,
			headers: {'auth': localStorage.getItem('apiToken')}
		}).then(response => {
			if ('data' in response.data) {
				this.locations = response.data.data.locations
				this.constructions = response.data.data.constructions
				this.furnitures = response.data.data.furnitures
				this.devices = response.data.data.devices
			}
		})
	},
	mounted: function () {
		this.areaSelector = this.$refs.areaSelector
	},
	methods: {
		setActiveTool: function (tool, isToggle) {
			const self = this
			Object.keys(this.toolsState).forEach(function (key, value) {
				if (key === tool) {
					if (isToggle) {
						return self.toolsState[key] = !self.toolsState[key]
					} else {
						return self.toolsState[key] = true
					}
				} else {
					return self.toolsState[key] = false
				}
			})
			this.moveableItem.destroyMoveable()
			this.removeDroppable()
		},
		removeDroppable: function () {
			document.querySelectorAll('.droppable').forEach(el => {
				el.classList.remove('droppable')
			})
		},
		setMoveable: function (target, prop) {
			this.moveableItem.setMoveable(target, prop)
		},
		cinemaMode: function () {
			this.$store.commit('toggleCinemaMode')
		},
		setLocationsEditMode: function () {
			this.locationsEditMode = true
			this.devicesEditMode = false
			this.setActiveTool('dummy')
		},
		setDevicesEditMode: function () {
			this.locationsEditMode = false
			this.devicesEditMode = true
			this.setActiveTool('dummy')
		},
		closeEditor: function () {
			this.setActiveTool('dummy')
		},
		floorPlanClick: function () {
			this.moveableItem.destroyMoveable()
		},
		deleteLocations: function () {
			this.setActiveTool('deletingLocations', true)
		},
		addLocationDialog: function () {
			if (this.toolsState.addingLocation) return

			let self = this
			this.$dialog
				.prompt({
					title: this.$t('dialogs.titles.enterLocationName'),
					body: this.$t('dialogs.bodies.clickToAddLocation')
				}, {
					promptHelp: '',
					okText: this.$t('buttons.ok'),
					cancelText: this.$t('buttons.cancel')
				})
				.then(function (dialogue) {
					axios({
						method: 'get',
						url: `http://${self.$store.state.settings['aliceIp']}:${self.$store.state.settings['apiPort']}/api/v1.0.1/myHome/locations/${dialogue.data}/`,
						headers: {'auth': localStorage.getItem('apiToken')}
					}).then(response => {
						if ('location' in response.data) {
							self.$dialog.alert(self.$t('dialogs.bodies.locationNameOrSynonymAlreadyExist')).then()
						} else {
							this.setActiveTool('addingLocation')
							self.newLocationName = dialogue.data
						}
					})
				})
				.catch(function () {
					this.setActiveTool('locationsEditMode')
					self.newLocationName = ''
				})
		},
		mouseDown: function (event) {
			if (this.toolsState.addingLocation) {
				this.clicked = true
				this.areaSelectorStartX = event.offsetX
				this.areaSelectorStartY = event.offsetY
				this.drawSelectionArea(this.areaSelectorStartX, this.areaSelectorStartY)
			} else if (event.target.classList.contains('floorPlan')) {
				event.target.classList.add('grabbed')
				this.draggingPlan = true
				this.draggingPlanStartX = event.clientX
				this.draggingPlanStartY = event.clientY
			}
		},
		mouseMove: function (event) {
			if (this.toolsState.addingLocation) {
				if (!this.clicked) return
				this.drawSelectionArea(event.offsetX, event.offsetY)
			} else if (this.draggingPlan) {
				this.floorPlanX += event.clientX - this.draggingPlanStartX
				this.floorPlanY += event.clientY - this.draggingPlanStartY

				this.draggingPlanStartX = event.clientX
				this.draggingPlanStartY = event.clientY
			}
		},
		drawSelectionArea: function (movedX, movedY) {
			let x = Math.min(this.areaSelectorStartX, movedX)
			let x2 = Math.max(this.areaSelectorStartX, movedX)
			let y = Math.min(this.areaSelectorStartY, movedY)
			let y2 = Math.max(this.areaSelectorStartY, movedY)

			this.areaSelectorX = x
			this.areaSelectorY = y
			this.areaSelectorW = x2 - x
			this.areaSelectorH = y2 - y
		},
		handleClick: function (event) {
			this.clicked = false
			if (this.toolsState.addingLocation) {
				event.preventDefault()
				event.stopPropagation()

				const data = {
					name: this.newLocationName,
					parentLocation: 0,
					settings: {
						x: this.areaSelectorStartX,
						y: this.areaSelectorStartY,
						w: this.areaSelectorW || 150,
						h: this.areaSelectorH || 150
					}
				}

				this.areaSelectorX = 0
				this.areaSelectorY = 0
				this.areaSelectorStartX = 0
				this.areaSelectorStartY = 0
				this.areaSelectorW = 0
				this.areaSelectorH = 0
				this.newLocationName = ''

				this.setActiveTool('locationsEditMode')

				axios({
					method: 'put',
					url: `http://${this.$store.state.settings['aliceIp']}:${this.$store.state.settings['apiPort']}/api/v1.0.1/myHome/locations/`,
					data: data,
					headers: {
						'auth': localStorage.getItem('apiToken'),
						'content-type': 'application/json'
					}
				}).then(response => {
					if ('location' in response.data) {
						let loc = response.data['location']
						this.$set(this.locations, loc.id, loc)
					}
				})
			} else if (this.draggingPlan) {
				event.target.classList.remove('grabbed')
				this.draggingPlan = false
			}
		},
		moveZUp(location) {
			const data = location.data
			const myIndex = data.settings['z']
			const myNewIndex = myIndex + 1;

			if (myNewIndex > this.locations.length) {
				return
			}

			for (const loc of Object.values(this.locations)) {
				if (loc.settings['z'] === myNewIndex) {
					loc.settings['z'] -= 1
					data.settings['z'] = myNewIndex
					this.saveLocationSettings(loc)
					this.saveLocationSettings(location)
					return
				}
			}
		},
		moveZDown(location) {
			const data = location.data
			const myIndex = data.settings['z']
			const myNewIndex = myIndex - 1;

			if (data.parentLocation > 0) {
				const parent = document.querySelector(`#loc_${data.parentLocation}`)
				if (myNewIndex <= parseInt(parent.style['z-index'])) {
					return
				}
			}

			if (myNewIndex < 0) {
				return
			}

			for (const loc of Object.values(this.locations)) {
				if (loc.settings['z'] === myNewIndex) {
					loc.settings['z'] += 1
					data.settings['z'] = myNewIndex
					this.saveLocationSettings(loc)
					this.saveLocationSettings(data)
					return
				}
			}
		},
		saveLocationSettings(location) {
			const data = {
				id: location.id,
				settings: location.settings
			}

			axios({
				method: 'patch',
				url: `http://${this.$store.state.settings['aliceIp']}:${this.$store.state.settings['apiPort']}/api/v1.0.1/myHome/locations/${data.id}/`,
				data: data,
				headers: {
					'auth': localStorage.getItem('apiToken'),
					'content-type': 'application/json'
				}
			}).then()
		},
		checkIfSynonymIsFree(synonym) {
			for (const location of Object.values(this.locations)) {
				if (location.name.toLowerCase() === synonym.toLowerCase()) return false

				for (const locationSynonym of location.synonyms) {
					if (locationSynonym.toLowerCase() === synonym.toLowerCase()) return false
				}
			}
			return true
		}
	},
	watch: {
		$route: {
			immediate: true,
			handler(to) {
				if (to.path !== '/myhome') {
					this.moveableItem.destroyMoveable()
				}
			}
		}
	}
}
