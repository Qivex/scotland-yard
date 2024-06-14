<template>
	<menu class="ticketmenu">
		<button
			class="ticket"
			v-for="(name,index) in ['Taxi','Bus','Subway','Black','2x']"
			v-text="tickets[index]"
			:title="name"
			:disabled="tickets[index] <= 0"
			@click="$emit('ticket', index+1)"
		/>
	</menu>
</template>

<script>
export default {
	name: "TicketMenu",
	props: {
		tickets: Array,
		names: Array
	},
	emits: ["ticket"]
}
</script>

<style>
.ticketmenu {
	margin: 0;
	/* Space buttons equally */
	display: flex;
	flex-direction: column;
	justify-content: space-evenly;
	/* On right side */
	position: absolute;
	height: 100%;
	top: 0;
	right: 5vh;
	/* Don't block clicks in gaps! */
	pointer-events: none;
}

.ticketmenu button {
	width: 24vh;
	height: 15vh;
	padding: 0;
	font-size: 3rem;
	border: none;
	/* ... but allow button clicks */
	pointer-events: initial;
}

.ticketmenu button:disabled {
	filter: contrast(25%);
}

.ticketmenu button[title="Taxi"] {
	color: black;
	background-color: yellow;
}

.ticketmenu button[title="Bus"] {
	color: white;
	background-color: green;
}

.ticketmenu button[title="Subway"] {
	color: white;
	background-color: red;
}

.ticketmenu button[title="Black"] {
	color: white;
	background-color: black;
}

.ticketmenu button[title="2x"] {
	color: black;
	background-color: orange;
}
</style>