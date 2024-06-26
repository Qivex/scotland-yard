<template>
	<template v-if="isIngame">
		<GameBoard
			ref="game"
			:boardID="boardID"
			@loaded="onLoaded"
			@selecttarget="onSelectTarget"
		/>
		<TicketMenu
			:tickets="remainingTickets"
			:class="{double: isDoubleMove}"
			@selectticket="onSelectTicket"
		/>
	</template>
	<Lobby v-else ref="lobby" :ownUUID="uuid">
		<AppearanceSelect @confirm="updateAppearance"/>
		<button @click="sendReady">Ready</button>
		<template v-if="isHosting">
			<InviteDialog v-if="isInviting" @connect="addNewConnection"/>
			<button @click="isInviting = true">Invite player</button>
			<button :disabled="!isEveryoneReady" @click="startGame">Start game</button>
		</template>
		<!--<AcceptDialog v-else/>-->
	</Lobby>
	<FullscreenToggle/>
</template>

<script>
import GameBoard from "../components/GameBoard.vue"
import TicketMenu from "../components/TicketMenu.vue"
import Lobby from "../components/Lobby.vue"
import InviteDialog from "../components/InviteDialog.vue"
import AppearanceSelect from "../components/AppearanceSelect.vue"
import FullscreenToggle from "../components/FullscreenToggle.vue"

import HostLogic from "../classes/HostLogic.js"
import { UserConnection } from "webrtc-via-qr"

export default {
	name: "MainApp",
	components: {
		GameBoard,
		TicketMenu,
		Lobby,
		InviteDialog,
		AppearanceSelect,
		FullscreenToggle
	},
	inject: {
		isInitialHost: {default: false},
		inviteCode: {default: ""}
	},
	data() {
		return {
			// Component handling
			isHosting: this.isInitialHost,
			isIngame: false,
			isInviting: false,
			isEveryoneReady: false,
			// Connection
			channelToHost: undefined,
			hostlogic: undefined,
			uuid: undefined,
			// Board setup
			boardID: undefined,
			appearances: undefined,
			// Ingame
			selectedTicket: undefined,
			remainingTickets: undefined,
			isDoubleMove: false
		}
	},
	methods: {
		handleHostMessage(command, content, answer) {
			switch (command) {
				case "id_assign":
					this.uuid = content.uuid
					answer("player_join", {uuid: content.uuid})
					break
				case "lobby_state":
					content.players.forEach(p => this.$refs.lobby.addPlayer(p))
					break
				case "player_join":
					this.$refs.lobby.addPlayer(content)
					break
				case "player_appearance_change":
					this.$refs.lobby.setPlayerAppearance(content.uuid, content.name, content.color)
					break
				case "player_ready":
					this.$refs.lobby.setPlayerReady(content.uuid)
					break
				case "everyone_ready":
					this.isEveryoneReady = true
					break
				case "game_start":
					this.appearances = this.$refs.lobby.players	// Store seperately because Lobby gets unmounted
					this.boardID = content.boardID
					this.isIngame = true	// Causes massive UI update
					break
				case "player_locations":
					this.addPlayerMarkers(content.locations)
					break
				case "move_options":
					this.$refs.game.displayMoveOptions(content.targets, "#fff")
					break
				case "player_move":
					this.$refs.game.movePlayerMarker(content.uuid, content.target)
					break
				case "double_move_started":
					this.isDoubleMove = true	// Only visual
					break
				case "turn_start":
					window.alert("Its your turn!")
					break
				case "turn_successful":
					this.selectedTicket = false	// Remove ticket selection
					this.isDoubleMove = false
					window.alert("Turn successful!")
					break
				case "turn_failed":
					this.isDoubleMove = false
					window.alert("Invalid move!")
					break
				case "ticket_update":
					this.remainingTickets = content.tickets
					break
				case "game_finished":
					window.alert("Game was won by " + content.winner)
					break
				default:
					console.log(command + " not handled")
					break
			}
		},
		addNewConnection(connection, sendChannel, receiveChannel) {
			this.hostlogic.addConnection(connection, sendChannel, receiveChannel)
			this.isInviting = false
		},
		updateAppearance(newName, newColor) {
			this.channelToHost.send(JSON.stringify({
				command: "player_appearance_change",
				content: {
					uuid: this.uuid,
					name: newName,
					color: newColor
				}
			}))
		},
		sendReady() {
			this.channelToHost.send(JSON.stringify({
				command: "player_ready",
				content: {
					uuid: this.uuid
				}
			}))
		},
		onLoaded() {
			this.channelToHost.send(JSON.stringify({
				command: "player_loaded",
				content: {
					uuid: this.uuid
				}
			}))
		},
		startGame() {
			this.channelToHost.send(JSON.stringify({
				command: "host_start_game"
			}))
		},
		addPlayerMarkers(places) {
			places.forEach((place, index) => {
				let player = this.appearances[index]
				this.$refs.game.addPlayerMarker(player.uuid, place, player.name, player.color, place === null)	// Hidden when no place
			})
		},
		onSelectTicket(ticketType) {
			if (ticketType === this.selectedTicket) {
				this.selectedTicket = false
				this.$refs.game.hideMoveOptions()
			} else {
				this.selectedTicket = ticketType
				this.channelToHost.send(JSON.stringify({
					command: "select_ticket",
					content: {
						"uuid": this.uuid,
						"ticket": ticketType
					}
				}))
			}
		},
		onSelectTarget(target) {
			this.channelToHost.send(JSON.stringify({
				command: "select_target",
				content: {
					"uuid": this.uuid,
					ticket: this.selectedTicket,
					target: target
				}
			}))
		}
	},
	mounted() {
		let connection, sendChannel
		// Get connection
		if (this.isHosting) {
			this.hostlogic = new HostLogic();	// Seriously?? Destructuring isnt parsed correctly without semicolon...
			[connection, sendChannel] = this.hostlogic.getPrivilegedConnection()
		} else {
			connection = new UserConnection({iceServers:[{urls:"stun:stun.cloudflare.com:3478"}]})
			sendChannel = connection.createDataChannel("fromuser")
			connection.acceptInvite(this.inviteCode)
				.then(accept => {
					// Mock scanning of QR code for now
					let bc = new BroadcastChannel("qr-bypass")
					bc.postMessage(accept)
					bc.close()
				})
		}
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
			// Setup message handling
			e.channel.addEventListener("message", e => {
				console.log(e.data)	// Todo: For debugging only
				const message = JSON.parse(e.data)
				let answer = (command, content) => sendChannel.send(JSON.stringify({command, content}))
				this.handleHostMessage(message.command, message.content, answer)
			})
			// Establish first contact
			// Todo: Not required if UUID is stored in localStorage
			sendChannel.send(JSON.stringify({command: "first_contact"}))
		})
		// Keep reference to sendChannel
		this.channelToHost = sendChannel
	}
}
</script>

<style>
@import url(../style/common.css);
</style>