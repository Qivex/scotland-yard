<template>
	<div class="lobby">
		<slot/>
		<ul>
			<li v-for="player in players" :class="{me: ownID === player.id}">
				<p v-text="player.name"></p>
				<div class="player-color-indicator" :style="{backgroundColor: player.color}" :class="{ready: player.ready}"></div>
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
	props: {
		ownID: String
	},
	emits: ["ready"],
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
		},
		updatePlayerReady(updatedPlayer) {
			let player = this.players.find(p => p.id === updatedPlayer.id)
			player.ready = true
			// Emit if everyone is ready
			let readyCount = this.players.filter(p => p.ready).length
			if (readyCount >= this.players.length) {
				this.$emit("ready")
			}
		}
	}
}
</script>

<style>
.me {
	outline: 2px solid red;
}

.player-color-indicator {
	width: 3rem;
	height: 3rem;
	border-radius: 1rem;
}

.ready {
	outline: 2px solid lime;
}
</style>