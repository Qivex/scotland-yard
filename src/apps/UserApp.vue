<template>
</template>

<script>
import { UserConnection } from "webrtc-via-qr"

function wrapAsComputed(component, propName) {
	return computed({
		get: () => component[propName],
		set: (newValue) => component[propName] = newValue
	})
}

export default {
	name: "UserApp",
	data() {
		return {
			connection: new UserConnection({iceServers:[{urls:"stun:stun.cloudflare.com:3478"}]}),
			sendChannel: undefined,
			receiveChannel: undefined
		}
	},
	inject: ["inviteCode"],
	mounted() {
		// Failure
		this.connection.addEventListener("connectionstatechange", e => {
			switch (this.connection.connectionState) {
				case "disconnected":
				case "failed":
					console.log("Connection failed")
					break
			}
		})
		// Success
		this.connection.addEventListener("datachannel", e => {
			this.sendChannel.send("msg from user")
			this.receiveChannel = e.channel
			e.channel.addEventListener("message", m => console.log(m.data))
		})
		// Attempt connection
		this.sendChannel = this.connection.createDataChannel("fromuser")
		this.connection.acceptInvite(this.inviteCode)
			// Mock scanning of QR code for now
			.then(accept => {
				let bc = new BroadcastChannel("accept-bypass")
				bc.postMessage(accept)
			})
	}
}
</script>