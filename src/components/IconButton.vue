<template>
	<img class="icon-button" :src="iconHref" :alt="description" :aria-label="description"/>
</template>

<script>
export default {
	name: "IconButton",
	props: {
		icon: String,
		description: String
	},
	computed: {
		iconHref() {
			return `${import.meta.env.BASE_URL}icons/${this.icon}.svg`
		}
	}
}
</script>

<style>
.icon-button {
	padding: 1rem;
	width: 3rem;
	height: 3rem;
	min-width: 3rem;
	min-height: 3rem;
	background-color: #a00;
	outline: 2px solid orange;
	border-radius: 1rem;
	cursor: pointer;
}

.icon-button:is(:active,:focus,:hover) {
	background-color: #800;
}
</style>