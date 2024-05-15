<template>
	<LeafletMap ref="leafletmap" v-bind="leafletOptions"/>
	<GameMenu/>
</template>

<script>
import Leaflet from "leaflet"

import LeafletMap from "../components/LeafletMap.vue"
import GameMenu from "../components/GameMenu.vue"

import board from "../data/board.json"
const [width, height] = board.size

export default {
	name: "MainApp",
	components: {
		LeafletMap,
		GameMenu
	},
	data() {
		return {
			buttonText: "Click",
			leafletOptions: {
				id: "game",
				tileURL: "board.png",
				mapOptions: {
					crs: Leaflet.CRS.Simple,
					attributionControl: false,
					zoomControl: false,
					maxZoom: 2,
					minZoom: 0,
					zoomSnap: 0.5
				},
				tileOptions: {
					tileSize: Leaflet.point(width, height),
					bounds: [
						[0, 0],
						[-height, width]
					],
					minNativeZoom: 0,
					maxNativeZoom: 0
				}
			}
		}
	},
	methods: {},
	mounted() {
		this.$refs.leafletmap.instance.setView([height/-2,width/2], 1, {animate: false})
	}
}
</script>

<style>
body {
	height: 100vh;
	margin: 0;
}

#game {
	height: 100%;
	z-index: 0;
}
</style>