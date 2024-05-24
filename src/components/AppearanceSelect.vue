<template>
	<div>
		<input type="text" v-model="name"/>
		<input type="color" v-model="color"/>
		<button @click="$emit('confirm', name, color)">Confirm</button>
	</div>
</template>
<script>
export default {
	name: "AppearanceSelect",
	emits: ["confirm"],
	data() {
		return {
			name: "",
			color: "#000000"
		}
	}
}
</script>