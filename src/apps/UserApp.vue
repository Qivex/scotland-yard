<template>
	<template v-if="isIngame">
		<GameBoard ref="game"/>
		<GameMenu/>
	</template>
	<Lobby v-else ref="lobby" :ownID="uuid">
		<AppearanceSelect @confirm="updateOwnAppearance"/>
		<button @click="updateOwnReady">Ready!</button>
	</Lobby>
</template>

<script>
import GameBoard from "../components/GameBoard.vue"
import GameMenu from "../components/GameMenu.vue"
import Lobby from "../components/Lobby.vue"
import AppearanceSelect from "../components/AppearanceSelect.vue"

import { UserConnection } from "webrtc-via-qr"

function wrapAsComputed(component, propName) {
	return computed({
		get: () => component[propName],
		set: (newValue) => component[propName] = newValue
	})
}

export default {
	name: "UserApp",
	components: {
		GameBoard,
		GameMenu,
		Lobby,
		AppearanceSelect
	},
	inject: ["inviteCode"],
	data() {
		return {
			isIngame: false,
			uuid: undefined,
			sendChannel: undefined
		}
	},
	methods: {
		handleMessage(type, content, respond) {
			switch (type) {
				case "id_assign":
					this.uuid = content.id
					respond("player_join", {id: content.id})
					break
				case "lobby_state":
					content.lobby.forEach(player => this.$refs.lobby.addPlayer(player))
					break
				case "player_join":
					this.$refs.lobby.addPlayer(content)
					break
				case "player_appearance_change":
					this.$refs.lobby.updatePlayerAppearance(content)
					break
				case "player_ready":
					this.$refs.lobby.updatePlayerReady(content)
					break
				case "game_start":
					this.isIngame = true
					break
				default:
					console.log(`Unknown message: ${type}`)
			}
		},
		updateOwnAppearance(newName, newColor) {
			const content = {
				id: this.uuid,
				name: newName,
				color: newColor
			}
			// Update own state
			this.$refs.lobby.updatePlayerAppearance(content)
			// Transmit to host
			this.sendChannel.send(JSON.stringify({
				type: "player_appearance_change",
				content
			}))
		},
		updateOwnReady() {
			const content = {
				id: this.uuid
			}
			// Update own state
			this.$refs.lobby.updatePlayerReady(content)
			// Transmit to host
			this.sendChannel.send(JSON.stringify({
				type: "player_ready",
				content: content
			}))
		}
	},
	mounted() {
		// Create connection
		let connection = new UserConnection({iceServers:[{urls:"stun:stun.cloudflare.com:3478"}]})
		let sendChannel = connection.createDataChannel("fromuser")
		this.sendChannel = sendChannel	// Store for later usage
		// Failure handler
		connection.addEventListener("connectionstatechange", e => {
			switch (connection.connectionState) {
				case "disconnected":
				case "failed":
					console.log("Connection failed")
					break
			}
		})
		// Success handler
		connection.addEventListener("datachannel", e => {
			// Setup message handling
			e.channel.addEventListener("message", e => {
				console.log(e.data)	// Todo: For debugging only
				const message = JSON.parse(e.data)
				let respond = (type, content) => sendChannel.send(JSON.stringify({type, content}))
				this.handleMessage(message.type, message.content, respond)
			})
			// Establish first contact
			// Todo: Not required if UUID is stored in localStorage
			sendChannel.send(JSON.stringify({type: "first_contact"}))
		})
		// Attempt connection
		connection.acceptInvite(this.inviteCode)
			// Mock scanning of QR code for now
			.then(accept => {
				let bc = new BroadcastChannel("qr-bypass")
				bc.postMessage(accept)
				bc.close()
			})
	}
}
</script>

<style>
@import url(../style/common.css);
</style>