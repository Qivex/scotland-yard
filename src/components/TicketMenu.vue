<template>
	<menu class="ticketmenu">
		<button
			class="ticket"
			v-for="(remaining,index) in tickets"
			v-text="remaining"
			:title="title[index]"
			:disabled="remaining <= 0"
			@click="$emit('selectticket', index)"
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
	data() {
		return {
			title: ['Taxi','Bus','Subway','Black','2x']
		}
	},
	emits: ["selectticket"]
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

.ticket {
	width: 24vh;
	height: 15vh;
	padding: 0;
	font-size: 3rem;
	border: none;
	/* ... but allow button clicks */
	pointer-events: initial;
}

.ticket:disabled {
	filter: contrast(25%);
}

.double .ticket {
	outline: 3px solid orange;
}

.ticket[title="Taxi"] {
	color: black;
	background-color: yellow;
}

.ticket[title="Bus"] {
	color: white;
	background-color: green;
}

.ticket[title="Subway"] {
	color: white;
	background-color: red;
}

.ticket[title="Black"] {
	color: white;
	background-color: black;
}

.ticket[title="2x"] {
	color: black;
	background-color: orange;
}
</style>