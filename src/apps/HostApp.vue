<template>
	<InviteDialog open/>
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
			connections: [],
			history: []
		}
	}
}
</script>