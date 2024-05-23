<template>
	<div class="lobby">
		<ul>
			<li v-for="player in players">
				<p v-text="player.name"></p>
				<div class="player-color-indicator" :style="{backgroundColor: player.color}"></div>
			</li>
		</ul>
	</div>
</template>

<script>
function getRandomColor() {
	return `hsl(${Math.floor(Math.random() * 360)} 100 50)`
}

export default {
	name: "Lobby",
	data() {
		return {
			players: [],
			unknownCounter: 0
		}
	},
	methods: {
		addPlayer(player) {
			console.assert(player.id, "Player has no id!")
			if (!player.name) {
				player.name = `Unknown (${++this.unknownCounter})`
			}
			if (!player.color) {
				player.color = getRandomColor()
			}
			this.players.push(player)
		},
		updatePlayerAppearance(updatedPlayer) {
			let player = this.players.find(p => p.id === updatedPlayer.id)
			player.name = updatedPlayer.name
			player.color = updatedPlayer.color
		}
	}
}
</script>

<style>
.player-color-indicator {
	width: 3rem;
	height: 3rem;
	border-radius: 1rem;
}
</style>