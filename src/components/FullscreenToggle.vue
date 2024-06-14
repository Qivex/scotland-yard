<template>
	<button class="fullscreen" title="Toggle Fullscreen" @click="toggleFullscreen">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 30" height="8vh">
			<path d="M29,1 h10v10 M1,19 v10h10 M1,11 v-10h10 M39,19 v10h-10" fill="none" stroke="currentColor" stroke-width="2"/>
		</svg>
	</button>
</template>

<script>
export default {
	name: "FullscreenToggle",
	methods: {
		toggleFullscreen() {
			if (document.fullscreenElement) {
				document.exitFullscreen()
			} else {
				document.documentElement.requestFullscreen({navigationUI: 'hide'})
			}
		}
	}
}
</script>

<style>
.fullscreen {
	position: absolute;
	left: 0;
	bottom: 0;
	padding: 5vh;
	border: none;
	background: none;
}

.fullscreen * {
	display: block;
	margin: auto;
}
</style>