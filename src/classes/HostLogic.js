import { HostConnection, UserConnection } from "webrtc-via-qr"
import GameLogic from "./GameLogic.js"

// Connection config (Todo: single export)
const config = {
	iceServers: [
		{urls: "stun:stun.l.google.com:19302"}
	]
}

// Shortcuts
function send(channel, command, content) {
	channel.send(JSON.stringify({command, content}))
}

function getRandomColor() {
	return `hsl(${Math.floor(Math.random() * 360)} 100 50)`
}

// Class
export default class HostLogic {
	constructor() {
		// Connection
		this.connections = []	// Can't be Object indexed by UUID because UUID is assigned *after* connection established
		this.uuidMapping = {}	// Mapping of "UUID -> index in connections[]" for easier targeting
		// Lobby
		this.players = []
		this.unknownCounter = 0
		// Game
		this.boardID = "board1"	// Todo: From "host_select_board" instead of default
		// State
		this.loadedCount = 0
		this.gameLogic = undefined
	}

	getConnectionByUUID(uuid) {
		let index = this.uuidMapping[uuid]
		return this.connections[index]
	}

	getPlayerByUUID(uuid) {
		return this.players.find(p => p.uuid === uuid)
	}

	getPlayerIndexByUUID(uuid) {
		return this.uuidMapping[uuid]
	}

	setPlayerAppearance(uuid, name, color) {
		let p = this.getPlayerByUUID(uuid)
		p.name = name
		p.color = color
	}

	setPlayerReady(uuid) {
		let p = this.getPlayerByUUID(uuid)
		p.ready = true
	}

	sendPositionsToAll() {
		// Send player locations
		let mrxLocation = this.gameLogic.playerPlaces[0]
		this.players.forEach((player, index) => {
			let channel = this.getConnectionByUUID(player.uuid)[1]
			channel.send(JSON.stringify({
				command: "player_locations",
				content: {
					locations: this.gameLogic.playerPlaces.with(0, index === 0 ? mrxLocation : null)
				}
			}))
		})
	}

	continueGame() {
		// This acts like an iterator until the end of the game
		// Its called for every move
		let nextPlayer = this.gameLogic.nextMove()
		if (nextPlayer !== false) {
			send(this.connections[nextPlayer][1], "turn_start")
		} else {
			// Game is over
			for (let connection of this.connections) {
				let channel = connection[1]
				send(channel, "game_finished", {winner: this.gameLogic.winner})
			}
		}
	}

	handleUserMessage(message, respondOptions) {
		let {command, content} = message
		let {answer, relay, broadcast, channel} = respondOptions
		switch(command) {
			case "first_contact":
				answer("id_assign", {uuid: window.crypto.randomUUID?.() || "localhost"})
				break
			case "player_join":
				const playerInfo = {
					uuid: content.uuid,
					name: content.name || `Unknown (${++this.unknownCounter})`,
					color: content.color || getRandomColor()
				}
				this.players.push(playerInfo)
				answer("lobby_state", {players: this.players})
				relay("player_join", playerInfo)
				// Update UUID-mapping
				this.uuidMapping[content.uuid] = this.connections.findIndex(c => c[1] === channel)
				console.log(content.uuid + " -> " + this.uuidMapping[content.uuid])
				break
			case "player_appearance_change":
				this.setPlayerAppearance(content.uuid, content.name, content.color)
				broadcast("player_appearance_change", content)
				break
			case "player_ready":
				this.setPlayerReady(content.uuid)
				broadcast("player_ready", content)
				// Let host know if everyone is ready
				let readyCount = this.players.filter(p => p.ready).length
				if (readyCount >= this.players.length) {
					send(this.connections[0][1], "everyone_ready")
				}
				break
			case "player_loaded":
				// Ticket menu is loaded
				answer("ticket_update", {tickets: this.gameLogic.remainingTickets[this.getPlayerIndexByUUID(content.uuid)]})
				// All players loaded
				if (++this.loadedCount >= this.players.length) {
					this.sendPositionsToAll()
					// First call, this actually starts the main game cycle
					this.continueGame()
				}
				break
			case "get_move_options":
				answer("move_options", {targets: this.gameLogic.getMoveOptions(this.getPlayerIndexByUUID(content.uuid), content.ticket)})
				break
			case "player_move":
				if (this.gameLogic.doMove(this.getPlayerIndexByUUID(content.uuid), content.ticket, content.target)) {
					answer("turn_successful")
					broadcast("player_move", content)
					// Update ticket count of Mr.X (always, because he either receives or uses)
					send(this.connections[0][1], "ticket_update", {tickets: this.gameLogic.remainingTickets[0]})
					// Update ticket count of detective (used ticket)
					if (this.getPlayerIndexByUUID(content.uuid) > 0) {
						answer("ticket_update", {tickets: this.gameLogic.remainingTickets[this.getPlayerIndexByUUID(content.uuid)]})
					}
					this.continueGame()
				} else {
					answer("turn_failed")
				}
				break
			default:
				answer("command_not_recognized", {command})
				break
		}
	}

	handlePrivilegedUserMessage(message, respondOptions) {
		let {command, content} = message
		let {answer, relay, broadcast, channel} = respondOptions
		switch (command) {
			case "host_start_game":
				this.gameLogic = new GameLogic()
				this.gameLogic.loadState({
					boardID: this.boardID,
					players: this.players.map(p => p.uuid)	// This assumes lobby order = move order -> Todo: Extra mapping
				}).then(() => {
					broadcast("game_start", {boardID: this.boardID})
				})
				break
			case "host_select_board":
				this.boardID = content.boardID
				break
			case "host_kick_player":
				answer("not_yet_implemented")
				break
			case "host_transfer_to_other_player":
				answer("not_yet_implemented")
				break
			default:
				// Fallback: Handle the non-privileged commands like all other users
				this.handleUserMessage(message, respondOptions)
				break
		}
	}

	// Helper to create pre-configured options for responding to messages
	getRespondOptions(respondChannel) {
		return {
			// Respond only to original sender ("answer")
			answer: (command, content) => {
				send(respondChannel, command, content)
			},
			// Transmit to all users except original sender ("relay")
			relay: (command, content) => {
				this.connections.forEach(c => {
					let relayChannel = c[1]
					if (relayChannel != respondChannel) {
						send(relayChannel, command, content)
					}
				})
			},
			// Transmit to all users ("broadcast")
			broadcast: (command, content) => {
				this.connections.forEach(c => send(c[1], command, content))
			},
			// Raw channel
			channel: respondChannel
		}
	}

	// Handle commands from user
	addConnection(connection, sendChannel, receiveChannel) {
		this.connections.push([connection, sendChannel, receiveChannel])
		receiveChannel.addEventListener("message", m => {
			// Normal message handling
			this.handleUserMessage(JSON.parse(m.data), this.getRespondOptions(sendChannel))
		})
	}

	// Give hosting player a channel with additional commands
	getPrivilegedConnection() {
		// 1) Create connections for both sides:
		//	- Host handles privileged commands only from this connection
		let hostConnection = new HostConnection(config)
		let sendChannel = hostConnection.createDataChannel("fromhost")
		// - User can send special commands using this connection
		let privilegedUserConnection = new UserConnection(config)	// Save for later
		let privilegedUserChannel = privilegedUserConnection.createDataChannel("fromuser")	// Save for later
		// 2) Connect them
		hostConnection.createInvite()
			.then(invite => privilegedUserConnection.acceptInvite(invite))
			.then(accept => hostConnection.confirmAccept(accept))
		// 3) Connection successful (is always local)
		hostConnection.addEventListener("datachannel", e => {
			let receiveChannel = e.channel
			this.connections.push([hostConnection, sendChannel, receiveChannel])
			receiveChannel.addEventListener("message", m => {
				// Special event handling for privileged user
				this.handlePrivilegedUserMessage(JSON.parse(m.data), this.getRespondOptions(sendChannel))
			})
		})
		return [privilegedUserConnection, privilegedUserChannel]
	}
}