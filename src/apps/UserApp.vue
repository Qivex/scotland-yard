<template>
	<Lobby ref="lobby"/>
</template>

<script>
import Lobby from "../components/Lobby.vue"

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
		Lobby
	},
	inject: ["inviteCode"],
	data() {
		return {
			uuid: undefined
		}
	},
	methods: {
		handleMessage(type, content, respond) {
			switch (type) {
				case "id_assign":
					this.uuid = content.id
					respond("join_lobby", {id: content.id})
					break
				case "player_join":
					this.$refs.lobby.addPlayer(content)
					break
				case "lobby_state":
					content.lobby.forEach(player => this.$refs.lobby.addPlayer(player))
					break
				default:
					console.log(`Unknown message: ${type}`)
			}
		}
	},
	mounted() {
		// Create connection
		let connection = new UserConnection({iceServers:[{urls:"stun:stun.cloudflare.com:3478"}]})
		let sendChannel = connection.createDataChannel("fromuser")
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