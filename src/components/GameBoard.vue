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

function convert(point) {
	return [-point[1],point[0]]
}

export default {
	name: "GameBoard",
	data() {
		return {
			map: undefined,
			board,
			players: {},
			selectedTicket: TICKET_TYPES.TAXI
		}
	},
	methods: {
		coordsFromPlaceID(placeID) {
			return convert(this.board.stations[placeID][0])
		},
		createCircle(place, color) {
			return Leaflet.circle(
				this.coordsFromPlaceID(place),
				{
					color: color,
					radius: 20
				}
			)
		},
		addPlayer(name, place, color) {
			// Leaflet marker
			let marker = this.createCircle(place, color).addTo(this.map)
			// Highlight targets on click
			marker.on("click", () => {
				let targetMarkers = []
				this.getMoveOptions(name, this.selectedTicket).forEach(targetPlace => {
					let targetMarker = this.createCircle(targetPlace, "#000").addTo(this.map)
					// Move player + remove targets
					targetMarker.on("click", () => {
						this.movePlayer(name, targetPlace)
						targetMarkers.forEach(m => m.remove())
					})
					targetMarkers.push(targetMarker)
				})
			})
			// Add to players
			this.players[name] = {
				place,
				marker
			}
		},
		movePlayer(name, target) {
			let player = this.players[name]
			// Update data
			player.place = target
			// Update marker
			player.marker.setLatLng(this.coordsFromPlaceID(target))
		},
		getMoveOptions(playerName, ticketType) {
			let currentPlace = this.players[playerName].place
			// Get connections
			let connectedPlaces = this.board.stations[currentPlace][ticketType] || []
			// Filter occupied places
			let playerInfo = Object.values(this.players)
			return connectedPlaces.filter(placeID => !playerInfo.some(player => player.place === placeID))
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
		// Test
		this.addPlayer("a", 0, "#f00")
		this.addPlayer("b", 2, "#0f0")
		this.addPlayer("c", 3, "#00f")
	}
}
</script>

<style>
#gameboard {
	height: 100%;
	z-index: 0;
}
</style>