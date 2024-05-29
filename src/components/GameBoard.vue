<template>
	<main id="gameboard"></main>
</template>

<script>
import "leaflet/dist/leaflet.css"
import Leaflet from "leaflet"

import board from "../data/board.json"
const [width, height] = board.size

const TICKET_TYPES = {
	TAXI: 1,
	BUS: 2,
	SUBWAY: 3,
	BLACK: 4,
	DOUBLE: 5
}

export default {
	name: "GameBoard",
	emits: [
		"loaded",
		"move"
	],
	props: {
		boardName: String
	},
	data() {
		return {
			map: undefined,
			board,	// Todo: Fetch
			selectedTicket: TICKET_TYPES.TAXI,
			// SoA instead of "players"-AoS because of (potential) deep watch and simpler updates
			playerUUIDs: [],
			playerNames: [],
			playerPlaces: [],
			playerMarkers: []
		}
	},
	methods: {
		getCoordsOfPlace(place) {
			return this.board.stations[place][0]
		},
		createCircle(place, color) {
			return Leaflet.circle(
				this.getCoordsOfPlace(place),
				{
					color: color,
					radius: 20
				}
			)
		},
		addPlayer(id, name, place, color) {
			// Get index
			let playerID = this.playerNames.length
			// Add id
			this.playerUUIDs.push(id)
			// Add name
			this.playerNames.push(name)
			// Add place
			this.playerPlaces.push(place)
			// Add marker
			let marker = this.createCircle(place, color).addTo(this.map)
			this.playerMarkers.push(marker)
			// Temporary behaviour: Every player moved by a single user
			marker.on("click", () => {
				// Highlight possible targets
				let availableTargets = []
				this.getMoveOptions(playerID, this.selectedTicket).forEach(target => {
					let targetMarker = this.createCircle(target, "#000").addTo(this.map)
					availableTargets.push(targetMarker)
					targetMarker.on("click", () => {
						// Remove available target markers, then move player
						availableTargets.forEach(m => m.remove())
						this.movePlayer(playerID, target)
					})
				})
			})
		},
		movePlayer(playerID, target) {
			// Update place
			this.playerPlaces[playerID] = target
			// Update marker (Todo: Deep watcher on playerPlaces?)
			this.playerMarkers[playerID].setLatLng(this.getCoordsOfPlace(target))
		},
		getMoveOptions(playerID, ticketType) {
			let currentPlace = this.playerPlaces[playerID]
			// Get connections
			let connectedPlaces = this.board.stations[currentPlace][ticketType] || []
			// Filter occupied places
			return connectedPlaces.filter(place => !this.playerPlaces.includes(place))
		},
		selectTicket(ticketType) {
			this.selectedTicket = ticketType
		}
	},
	mounted() {
		// Map init
		this.map = Leaflet.map("gameboard", {
			crs: Leaflet.CRS.Simple,
			attributionControl: false,
			zoomControl: false,
			maxZoom: 2,
			minZoom: 0,
			zoomSnap: 0.5,
			center: [
				height/-2,
				width/2
			],
			zoom: 1
		})
		Leaflet.tileLayer("board.png", {
			tileSize: Leaflet.point(width, height),
			bounds: [
				[0, 0],
				[-height, width]
			],
			minNativeZoom: 0,
			maxNativeZoom: 0
		}).addTo(this.map)
		// Emit when board is ready to add players
		this.$emit("loaded")
	}
}
</script>

<style>
#gameboard {
	height: 100%;
	z-index: 0;
}
</style>