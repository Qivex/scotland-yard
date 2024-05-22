<template>
	<dialog>
		<a v-if="inviteCode" :href="inviteURL" target="_blank">QR</a>
	</dialog>
</template>

<script>
import { HostConnection } from "webrtc-via-qr"

export default {
	name: "InviteDialog",
	data() {
		return {
			connection: new HostConnection({iceServers:[{urls:"stun:stun.cloudflare.com:3478"}]}),
			sendChannel: undefined,
			receiveChannel: undefined,
			inviteCode: undefined
		}
	},
	computed: {
		inviteURL() {
			return "http://localhost:5173/index.html?invite=" + this.inviteCode
		}
	},
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
			this.sendChannel.send("msg from host")
			this.receiveChannel = e.channel
			e.channel.addEventListener("message", m => console.log(m.data))
		})
		// Attempt connection
		this.sendChannel = this.connection.createDataChannel("fromhost")
		this.connection.createInvite()
			.then(inviteCode => {
				this.inviteCode = inviteCode
			})
		
		// Mock scanning of QR code for now
		let bc = new BroadcastChannel("accept-bypass")
		bc.addEventListener("message", msg => {
			this.connection.confirmAccept(msg.data)
		})
	}
}
</script>