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
@import url(../style/common.css);
</style>