<template>
	<dialog>
		<a v-if="inviteCode" :href="src" target="_blank">QR</a>
	</dialog>
</template>

<script>
import { HostConnection } from "webrtc-via-qr"

export default {
	name: "InviteDialog",
	data() {
		return {
			inviteCode: undefined,
			src: "/"
		}
	},
	watch: {
		inviteCode(code) {
			// this.src = QRCode.toDataURL("http://192.168.0.154:5173/?invite=" + code)
			this.src = "http://localhost:5173/index.html?invite=" + this.inviteCode
		}
	},
	emits: ["connect"],
	mounted() {
		this.$el.show()
		// Create connection
		let connection = new HostConnection({iceServers:[{urls:"stun:stun.cloudflare.com:3478"}]})
		let sendChannel = connection.createDataChannel("fromhost")
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
			sendChannel.send("msg from host")
			e.channel.addEventListener("message", m => console.log(m.data))
			this.$emit("connect", connection, sendChannel, e.channel)
		})
		// Attempt connection
		connection.createInvite()
			.then(inviteCode => this.inviteCode = inviteCode)
		// Mock scanning of QR code for now
		let bc = new BroadcastChannel("qr-bypass")
		bc.addEventListener("message", msg => connection.confirmAccept(msg.data))
	},
	unmounted() {
		this.$el.close()
	}
}
</script>