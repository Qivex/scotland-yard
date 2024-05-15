<template>
	<menu class="gamemenu">
		<menu class="rowmenu collapsed">
			<IconButton icon="ticket" description="Ticket Menu" @click="toggleMenu"/>
			<IconButton v-for="(name,index) in ['taxi','bus','subway','black','2x']" :icon="name" :description="name" @click="selectTicket(index)"/>
		</menu>
		<menu class="rowmenu collapsed">
			<IconButton icon="marker" description="Marker" @click="toggleMenu"/>
			<IconButton v-for="(name,index) in ['circle','dashed','line','erase']" :icon="name" :description="name" @click="selectMarker(index)"/>
			<IconButton icon="clear" description="Clear all markers" @click="clearAllMarkers"/>
		</menu>
		<menu class="rowmenu collapsed">
			<IconButton icon="settings" description="Settings" @click="toggleMenu"/>
			<IconButton icon="fullscreen" description="Fullscreen" @click="toggleFullscreen"/>
			<IconButton icon="export" description="Export game" @click="exportState"/>
		</menu>
		<menu class="rowmenu">
			<IconButton icon="endturn" description="End turn" @click="lockTurn"/>
		</menu>
	</menu>
</template>

<script>
import IconButton from "./IconButton.vue"

function toggleMenu(e) {
	e.target.parentElement.classList.toggle("collapsed")
}

export default {
	name: "GameMenu",
	components: {
		IconButton
	},
	methods: {
		toggleMenu: toggleMenu,
		selectTicket(type) {
			console.log("Selected ticket type " + type)
		},
		selectMarker(type) {
			console.log("Selected marker type " + type)
		},
		clearAllMarkers() {
			console.log("Clearing all markers...")
		},
		toggleFullscreen() {
			console.log("Toggled fullscreen")
		},
		exportState() {
			console.log("Exporting state...")
		},
		lockTurn() {
			console.log("Locked in turn!")
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