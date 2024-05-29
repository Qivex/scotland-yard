<template>
	<div class="lobby">
		<slot/>
		<ul>
			<li v-for="player in players" :class="{me: ownUUID === player.uuid}">
				<p v-text="player.name"></p>
				<div class="player-color-indicator" :style="{backgroundColor: player.color}" :class="{ready: player.ready}"></div>
			</li>
		</ul>
	</div>
</template>

<script>
export default {
	name: "Lobby",
	props: {
		ownUUID: String
	},
	data() {
		return {
			players: []
		}
	},
	methods: {
		addPlayer(player) {
			console.assert(player.uuid && player.name && player.color, "Incomplete player data!")
			this.players.push(player)
		},
		getPlayerByUUID(uuid) {
			return this.players.find(p => p.uuid === uuid)
		},
		setPlayerAppearance(uuid, name, color) {
			let player = this.getPlayerByUUID(uuid)
			player.name = name
			player.color = color
		},
		setPlayerReady(uuid) {
			let player = this.getPlayerByUUID(uuid)
			player.ready = true
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