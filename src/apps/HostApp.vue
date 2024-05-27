<template>
	<template v-if="isIngame">
		<GameBoard ref="game" :board="boardName" :players="playerCache"
			@loaded="onBoardLoaded"
			@move="selectMove"
		/>
		<GameMenu
			@ticket="selectTicket"
			@fullscreen="toggleFullscreen"
			@lock="endTurn"
		/>
	</template>
	<Lobby v-else ref="lobby" ownID="host" @ready="startGame">
		<button @click="isInviting = true">Invite</button>
		<button @click="hostReady">Host ready</button>
		<button :disabled="!$refs?.lobby?.isEveryoneReady">Start game</button>
		<InviteDialog v-if="isInviting" @connect="onConnect"/>
	</Lobby>
</template>

<script>
import GameBoard from "../components/GameBoard.vue"
import GameMenu from "../components/GameMenu.vue"
import Lobby from "../components/Lobby.vue"
import InviteDialog from "../components/InviteDialog.vue"

export default {
	name: "HostApp",
	components: {
		GameBoard,
		GameMenu,
		Lobby,
		InviteDialog
	},
	data() {
		return {
			isInviting: false,
			isIngame: false,
			connections: [],
			// history: [],
			playerCache: undefined
		}
	},
	methods: {
		broadcast(type, content) {
			this.connections.forEach(c => {
				let sendChannel = c[1]
				sendChannel.send(JSON.stringify({type, content}))
			})
		},
		handleMessage(type, content, respond, relay) {
			switch (type) {
				case "first_contact":
					respond("id_assign", {id: window.crypto.randomUUID()})
					break
				case "player_join":
					// Add player to lobby
					this.$refs.lobby.addPlayer(content)
					// Respond with current lobby state
					respond("lobby_state", {lobby: this.$refs.lobby.players})
					// Let others know of new player
					relay("player_join", content)
					break
				case "player_appearance_change":
					this.$refs.lobby.updatePlayerAppearance(content)
					relay("player_appearance_change", content)
					break
				case "player_ready":
					this.$refs.lobby.updatePlayerReady(content)
					relay("player_ready", content)
					break
				case "board_loaded":
					// TODO
					break
				default:
					console.log(`Unknown message: ${type}`)
			}
		},
		onConnect(connection, sendChannel, receiveChannel) {
			receiveChannel.addEventListener("message", e => {
				console.log(e.data)	// Todo: For debugging only
				const message = JSON.parse(e.data)
				// Respond only to sender
				let respond = (type, content) => sendChannel.send(JSON.stringify({type, content}))
				// Send to all others ("relay")
				let relay = (type, content) => {
					this.connections.forEach(c => {
						let relayChannel = c[1]
						if (relayChannel != sendChannel) {
							relayChannel.send(JSON.stringify({type, content}))
						}
					})
				}
				this.handleMessage(message.type, message.content, respond, relay)
			})
			// Todo: Handle disconnects
			this.connections.push([connection, sendChannel, receiveChannel])
			this.isInviting = false
		},
		hostReady() {
			this.$refs.lobby.updatePlayerReady({id: "host"})
			this.broadcast("player_ready", {id: "host"})
		},
		startGame() {
			const playerCache = this.$refs.lobby.players.map((p, index) => {
				p.place = index // Very temporary!!
				return p
			})
			this.playerCache = playerCache
			this.broadcast("game_start", {
				players: playerCache
			})
			this.isIngame = true
		}
	},
	mounted() {
		this.$refs.lobby.addPlayer({id: "host", name: "HOST", color: "#000"})
	}
}
</script>

<style>
@import url(../style/common.css);
</style>