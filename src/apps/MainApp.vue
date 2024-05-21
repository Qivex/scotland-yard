<template>
	<GameBoard/>
	<GameMenu/>
</template>

<script>
import GameBoard from "../components/GameBoard.vue"
import GameMenu from "../components/GameMenu.vue"

export default {
	name: "MainApp",
	components: {
		GameBoard,
		GameMenu
	}
}
</script>

<style>
body {
	height: 100vh;
	margin: 0;
}
</style>