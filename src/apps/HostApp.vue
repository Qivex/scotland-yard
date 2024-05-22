<template>
	<button @click="isInviteDialogOpen = true">Invite</button>
	<InviteDialog v-if="isInviteDialogOpen" @connect="onConnect"/>
</template>

<script>
import InviteDialog from "../components/InviteDialog.vue"

export default {
	name: "HostApp",
	components: {
		InviteDialog
	},
	data() {
		return {
			isInviteDialogOpen: false,
			connections: [],
			history: []
		}
	},
	methods: {
		openNewDialog() {
			this.open = !this.open
		},
		onConnect(connection, sendChannel, receiveChannel) {
			this.connections.push([connection, sendChannel, receiveChannel])
			this.isInviteDialogOpen = false
		}
	}
}
</script>