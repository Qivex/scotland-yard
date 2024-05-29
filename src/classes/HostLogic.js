import { HostConnection, UserConnection } from "webrtc-via-qr"

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
		this.boardName = "board"
	}

	getConnectionByUUID(uuid) {
		let index = this.uuidMapping[uuid]
		return this.connections[index]
	}

	getPlayerByUUID(uuid) {
		return this.players.find(p => p.uuid === uuid)
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

	handleUserMessage(message, respondOptions) {
		let {command, content} = message
		let {answer, relay, broadcast} = respondOptions
		switch(command) {
			case "first_contact":
				answer("id_assign", {uuid: window.crypto.randomUUID()})
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
			default:
				answer("command_not_recognized", {command})
				break
		}
	}

	handlePrivilegedUserMessage(message, respondOptions) {
		let {command, content} = message
		let {answer, relay, broadcast} = respondOptions
		switch (command) {
			case "host_start_game":
				broadcast("game_start", {
					board: this.boardName,
					players: this.players.map((p, index) => {
						p.place = index // Very temporary!!
						return p
					})
				})
				break
			case "host_select_board":
				this.boardName = content.board
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
			}
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