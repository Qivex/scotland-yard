<template>
	<button @click="isInviteDialogOpen = true">Invite</button>
	<InviteDialog v-if="isInviteDialogOpen" @connect="onConnect"/>
	<Lobby ref="lobby"/>
</template>

<script>
import InviteDialog from "../components/InviteDialog.vue"
import Lobby from "../components/Lobby.vue"

export default {
	name: "HostApp",
	components: {
		InviteDialog,
		Lobby
	},
	data() {
		return {
			isInviteDialogOpen: false,
			connections: []
			// history: []
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
				case "join_lobby":
					// Add player to lobby
					this.$refs.lobby.addPlayer(content)
					// Respond with current lobby state
					respond("lobby_state", {lobby: this.$refs.lobby.players})
					// Let others know of new player
					relay("player_join", content)
					break
				case "player_appearance_change":
					this.$refs.lobby.updatePlayerAppearance(content)
					// Todo: relay to others
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
			this.isInviteDialogOpen = false
		}
	},
	mounted() {
		this.$refs.lobby.addPlayer({id: "host", name: "HOST", color: "#000"})
	}
}
</script>