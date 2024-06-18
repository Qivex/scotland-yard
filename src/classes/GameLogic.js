function randomInt(limit) {
	return Math.floor(Math.random() * limit)
}

const TICKET_TYPES = {
	TAXI: 0,
	BUS: 1,
	SUBWAY: 2,
	BLACK: 3,
	DOUBLE: 4
}

export default class GameLogic {
	constructor() {
		this.currentTurn = 0	// 0 <= currentTurn < boardData.turnCount
		this.currentMove = 0	// 0 <= currentMove < players.length
		this.board = undefined
		this.boardID = undefined
		this.players = []
		this.turns = []
		// Calculated:
		this.starts = []
		this.remainingTickets = []
		this.playerPlaces = []
		this.winner = false
	}

	loadBoard(boardID) {
		this.boardID = boardID
		return fetch(`${import.meta.env.BASE_URL}boards/${boardID}.json`)
			.then(res => res.json())
			.then(boardJSON => this.board = boardJSON)
	}

	loadState(state) {
		return this.loadBoard(state.boardID)
			.then(() => {
				this.boardID = state.boardID
				this.players = state.players
				this.starts = state.starts || []
				// this.turns = state.turns || []
				// Determine initial locations
				if (this.starts.length === 0) {
					let startPlaces = new Set()
					while (startPlaces.size < this.players.length) {
						let randomIndex = randomInt(this.board.startLocations.length)
						startPlaces.add(this.board.startLocations[randomIndex])
					}
					this.starts = Array.from(startPlaces)
				}
				// Initialize values
				this.currentTurn = 0
				this.currentMove = 0
				this.turns = []
				this.playerPlaces = Array.from(this.starts)
				for (let index = 0; index < this.players.length; index++) {
					// Copy from correct list (0 = Mr.X, 1 = detectives)
					this.remainingTickets[index] = Array.from(this.board.tickets[Math.sign(index)])
				}
				// Replay all previous turns (to calculate current values)
				if (state.turns) {
					for (let turn of state.turns) {
						for (let move of turn) {
							let currentPlayer = this.nextMove()
							if (currentPlayer !== false) {
								let valid = true
								if (Object.hasOwn(move, "secondTarget")) {
									valid = this.doDoubleMove(currentPlayer, move.firstTicket, move.firstTarget, move.secondTicket, move.secondTarget)
								} else {
									valid = this.doMove(currentPlayer, move.ticket, move.target)
								}
								console.assert(valid, "Invalid move in turn log!")
							}
						}
					}
				}
			})
	}

	exportState() {
		// Don't include properties which can be calculated from these by replaying turns
		return {
			boardID: this.boardID,
			players: this.players,
			starts: this.starts,
			turns: this.turns
		}
	}

	getMoveOptions(playerIndex, ticketType) {
		return this.getFreeConnections(this.playerPlaces[playerIndex], ticketType)
	}

	getFreeConnections(currentPlace, ticketType) {
		let connectedPlaces
		if (ticketType === TICKET_TYPES.BLACK) {
			let allConnections = this.board.connections[currentPlace].flat()	// Could include duplicates!
			connectedPlaces = Array.from(new Set(allConnections))	// Remove duplicates
		} else {
			connectedPlaces = this.board.connections[currentPlace][ticketType] || []
		}
		// Filter occupied places (but not Mr.X!)
		return connectedPlaces.filter(place => !this.playerPlaces.with(0, false).includes(place))
	}

	isMatchOver() {
		// Switch to next turn after all players moved
		if (this.currentMove >= this.players.length) {
			this.currentMove = 0
			this.currentTurn++
		}
		// Win condition: Last move
		if (this.currentTurn > this.board.turnCount) {
			this.winner = "mrx"
			return true
		}
		// Win condition: Mr.X caught
		if (new Set(this.playerPlaces).size < this.playerPlaces.length) {
			// Less elems in set = duplicate places = Mr.X is caught!
			this.winner = "detectives"
			return true
		}
		// Win condition: No move possible
		let playerIndex = this.currentMove
		let moveCount = 0
		for (let ticketType = 0; ticketType <= 3; ticketType++) {
			// Only consider tickets the player actually has!
			if (this.remainingTickets[playerIndex][ticketType] > 0) {
				moveCount += this.getMoveOptions(playerIndex, ticketType)
			}
		}
		if (moveCount <= 0) {
			this.winner = (playerIndex === 0) ? "detectives" : "mrx"
			return true
		}
		// Continue game
		return false
	}

	nextMove() {
		if (this.isMatchOver()) {
			return false
		}
		return this.currentMove	// Only increases AFTER a successful move
	}

	doMove(playerIndex, ticketType, target) {
		console.assert(0 <= playerIndex && playerIndex < this.players.length, "Unknown player!")
		console.assert(0 <= ticketType && ticketType <= 3, "Unknown ticket!")
		console.assert(0 <= target && target < this.board.stations.length, "Unknown target!")

		let isValid = true
		// Is it this players turn?
		isValid &&= (playerIndex === this.currentMove)
		// Does the player have tickets remaining?
		isValid &&= (this.remainingTickets[playerIndex][ticketType] > 0)
		// Is the target connected & free?
		isValid &&= this.getMoveOptions(playerIndex, ticketType).includes(target)
		// Execute move
		if (isValid) {
			// Start turn if no previous move
			this.turns[this.currentTurn] ||= []
			// Reduce ticket count
			this.remainingTickets[playerIndex][ticketType]--
			// Give Mr.X used ticket
			if (playerIndex > 0) {
				this.remainingTickets[0][ticketType]++
			}
			// Add move to turn log
			this.turns[this.currentTurn][this.currentMove] = {
				ticket: ticketType,
				target: target
			}
			// Move player
			this.playerPlaces[playerIndex] = target
			// Next move
			this.currentMove++
		}
		return isValid
	}

	doDoubleMove(playerIndex, firstTicket, firstTarget, secondTicket, secondTarget) {
		console.assert(0 <= playerIndex && playerIndex < this.players.length, "Unknown player!")
		console.assert(0 <= firstTicket && firstTicket <= 3, "Unknown first ticket!")
		console.assert(0 <= secondTicket && secondTicket <= 3, "Unknown second ticket!")
		console.assert(0 <= firstTarget && firstTarget < this.board.stations.length, "Unknown first target!")
		console.assert(0 <= secondTarget && secondTarget < this.board.stations.length, "Unknown second target!")

		let isValid = true
		// Is it this players turn?
		isValid &&= (playerIndex === this.currentMove)
		// Does the player have the required tickets?
		isValid &&= (this.remainingTickets[playerIndex][TICKET_TYPES.DOUBLE] > 0)
		isValid &&= (this.remainingTickets[playerIndex][firstTicket] > 0)
		isValid &&= (this.remainingTickets[playerIndex][secondTicket] > 0)
		// Are both targets connected and free?
		isValid &&= this.getMoveOptions(playerIndex, firstTicket).includes(firstTarget)
		isValid &&= this.getFreeConnections(firstTarget, secondTicket).includes(secondTarget)
		// Execute move
		if (isValid) {
			// Start turn if no previous move
			this.turns[this.currentTurn] ||= []
			// Reduce ticket count
			this.remainingTickets[playerIndex][TICKET_TYPES.DOUBLE]--
			this.remainingTickets[playerIndex][firstTicket]--
			this.remainingTickets[playerIndex][secondTicket]--
			// Give Mr.X used tickets
			if (playerIndex > 0) {
				this.remainingTickets[0][TICKET_TYPES.DOUBLE]++
				this.remainingTickets[0][firstTicket]++
				this.remainingTickets[0][secondTicket]++
			}
			// Add move to turn log
			this.turns[this.currentTurn][this.currentMove] = {
				firstTicket,
				firstTarget,
				secondTicket,
				secondTarget
			}
			// Move player
			this.playerPlaces[playerIndex] = secondTarget
			// Next move
			this.currentMove++
		}
		return isValid
	}
}