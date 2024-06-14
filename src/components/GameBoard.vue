<template>
	<main id="gameboard"></main>
</template>

<script>
import "leaflet/dist/leaflet.css"
import Leaflet from "leaflet"

function circle(latlng, color) {
	return Leaflet.circle(latlng, {color: color, radius: 20})
}

export default {
	name: "GameBoard",
	emits: [
		"loaded",
		"move"
	],
	props: {
		boardID: String
	},
	data() {
		return {
			map: undefined,
			board: undefined,
			playerMarkers: {},
			currentMoveOptions: []
		}
	},
	methods: {
		getCoordsOfPlace(place) {
			return this.board.stations[place]?.[0] || [0,0]
		},
		addPlayerMarker(uuid, place, name, color, hidden) {
			let marker = circle(this.getCoordsOfPlace(place), color)
			marker.bindTooltip(name)
			if (!hidden) {
				marker.addTo(this.map)
			}
			this.playerMarkers[uuid] = marker
		},
		movePlayerMarker(uuid, target) {
			this.playerMarkers[uuid].setLatLng(this.getCoordsOfPlace(target))
		},
		hidePlayerMarker(uuid) {
			this.playerMarkers[uuid].remove()
		},
		revealPlayerMarker(uuid) {
			this.playerMarkers[uuid].addTo(this.map)
		},
		displayMoveOptions(targets, color) {
			this.hideMoveOptions()	// Dont overlap with previous ones!
			for (const place of targets) {
				let marker = circle(this.getCoordsOfPlace(place), color)
				marker.on("click", () => {
					this.hideMoveOptions()
					this.$emit("targetselect", place)
				})
				marker.addTo(this.map)
				this.currentMoveOptions.push(marker)
			}
		},
		hideMoveOptions() {
			for (const marker of this.currentMoveOptions) {
				marker.remove()
			}
			this.currentMoveOptions = []
		}
	},
	mounted() {
		// Fetch board data
		fetch(`${import.meta.env.BASE_URL}boards/${this.boardID}.json`)
			.then(res => res.json())
			.then(boardData => {
				this.board = boardData
				const [width, height] = this.board.image.size
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
				Leaflet.tileLayer(this.board.image.src, {
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
			})
	}
}
</script>

<style>
#gameboard {
	height: 100%;
	z-index: 0;
}
</style>