<template>
	<div :id="id"></div>
</template>

<script>
import "leaflet/dist/leaflet.css"
import Leaflet from "leaflet"

export default {
	name: "LeafletMap",
	props: {
		id: String,
		mapOptions: Object,
		tileURL: String,
		tileOptions: Object
	},
	data() {
		return {
			instance: undefined,
			tilelayer: undefined
		}
	},
	mounted() {
		this.instance = Leaflet.map(this.id, this.mapOptions)
		this.tilelayer = Leaflet.tileLayer(this.tileURL, this.tileOptions).addTo(this.instance)
	}
}
</script>