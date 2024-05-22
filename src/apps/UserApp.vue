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
	inject: ["inviteCode"],
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
			sendChannel.send("msg from user")
			e.channel.addEventListener("message", m => console.log(m.data))
		})
		// Attempt connection
		connection.acceptInvite(this.inviteCode)
			// Mock scanning of QR code for now
			.then(accept => {
				let bc = new BroadcastChannel("qr-bypass")
				bc.postMessage(accept)
			})
	}
}
</script>