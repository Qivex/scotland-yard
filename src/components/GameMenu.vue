<template>
	<menu class="gamemenu">
		<menu class="rowmenu collapsed">
			<IconButton icon="ticket" description="Ticket Menu" @click="toggleMenu"/>
			<IconButton v-for="(name,index) in ['taxi','bus','subway','black','2x']" :icon="name" :description="name" @click="$emit('ticket', index+1)"/>
		</menu>
		<menu class="rowmenu collapsed">
			<IconButton icon="marker" description="Marker" @click="toggleMenu"/>
			<IconButton v-for="(name,index) in ['circle','dashed','line','erase']" :icon="name" :description="name" @click="$emit('marker', index)"/>
			<IconButton icon="clear" description="Clear all markers" @click="$emit('clear')"/>
		</menu>
		<menu class="rowmenu collapsed">
			<IconButton icon="settings" description="Settings" @click="toggleMenu"/>
			<IconButton icon="fullscreen" description="Fullscreen" @click="$emit('fullscreen')"/>
			<IconButton icon="export" description="Export game" @click="$emit('export')"/>
		</menu>
		<menu class="rowmenu">
			<IconButton icon="endturn" description="End turn" @click="$emit('lock')"/>
		</menu>
	</menu>
</template>

<script>
import IconButton from "./IconButton.vue"

export default {
	name: "GameMenu",
	components: {
		IconButton
	},
	emits: [
		"ticket",
		"marker",
		"clear",
		"fullscreen",
		"export",
		"lock"
	],
	methods: {
		toggleMenu(e) {
			e.target.parentElement.classList.toggle("collapsed")
		}
	}
}
</script>

<style>
.gamemenu {
	margin: 0;
	/* Space submenus equally */
	display: flex;
	flex-direction: column;
	justify-content: space-around;
	/* On right side */
	position: absolute;
	height: 100%;
	top: 0;
	right: 2rem;
	/* Don't block events in gaps! */
	pointer-events: none;
}

.rowmenu {
	display: flex;
	gap: 1rem;
	/* Right to left */
	flex-direction: row-reverse;
}

/* Undo event prevention in gaps */
.rowmenu * {
	pointer-events: auto;
}

.rowmenu :first-child {
	margin-inline-start: 2rem;
}

.rowmenu.collapsed :not(:first-child) {
	display: none;
}
</style>