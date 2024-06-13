function randomInt(limit) {
	return Math.floor(Math.random() * limit)
}

export default class GameLogic {
	constructor() {
		this.currentTurn = 0	// 0 <= currentTurn < boardData.turnCount
		this.currentMove = 0	// 0 <= currentMove < players.length
		this.board = undefined
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
				this.players = state.players
				this.starts = state.starts || []
				this.turns = state.turns || []
				// Determine initial locations
				if (this.starts.length === 0) {
					let startPlaces = new Set()
					while (startPlaces.size < this.players.length) {
						let randomIndex = randomInt(this.board.startLocations.length)
						startPlaces.add(this.board.startLocations[randomIndex])
					}
					this.starts = Array.from(startPlaces)
				}
				// Determine current turn & move
				if (this.turns.length === 0) {
					this.currentTurn = 0
					this.currentMove = 0
				} else {
					this.currentTurn = this.turns.length - 1
					this.currentMove = this.turns[this.currentTurn].length
				}
				// Determine current tickets & positions
				for (let index = 0; index < this.players.length; index++) {
					// Initial tickets & positions
					this.remainingTickets[index] = this.board.tickets[Math.sign(index)]
					this.playerPlaces[index] = this.starts[index]
					// Replay turns
					for (let turn of this.turns) {
						let move = turn[index]
						if (Array.isArray(move)) {
							for (let subMove of move) {
								// Subtract used tickets
								this.remainingTickets[index][subMove.ticket]--
								// Update position
								this.playerPlaces[index] = subMove.target
							}
						}
					}
				}
			})
	}

	exportState() {
		// Don't include properties which can be calculated from these
		return {
			boardID: this.boardID,
			players: this.players,
			starts: this.starts,
			turns: this.turns
		}
	}

	getMoveOptions(playerIndex, ticketType) {
		// Todo: Black ticket!
		let currentPlace = this.playerPlaces[playerIndex]
		// Get connections
		let connectedPlaces = this.board.stations[currentPlace][ticketType] || []
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
		let moveCount = 0
		for (let ticketType = 1; ticketType <= 4; ticketType++) {
			moveCount += this.getMoveOptions(this.currentMove, ticketType)
		}
		if (moveCount <= 0) {
			this.winner = (this.currentMove === 0) ? "detectives" : "mrx"
			return true
		}
		// Continue game
		return false
	}

	nextMove() {
		if (this.isMatchOver()) {
			return false
		}
		return this.currentMove	// Only increase this AFTER a successful move
	}

	doMove(playerIndex, ticketType, target) {
		// console.assert(this.players.includes(uuid), "Unknown player!")
		console.assert(1 <= ticketType <= 5, "Unknown ticket!")
		console.assert(0 <= target < this.board.stations.length, "Unknown target!")

		// let playerIndex = this.players.indexOf(uuid)
		let isValid = true
		// Is it this players turn?
		isValid &&= (playerIndex === this.currentMove)
		// Does the player have tickets remaining?
		isValid &&= (this.remainingTickets[playerIndex][ticketType] > 0)
		// Is the target connected & free?
		isValid &&= this.getMoveOptions(playerIndex, ticketType).includes(target)
		// Execute turn
		if (isValid) {
			// Assign move if no previous sub-move
			this.turns[this.currentTurn][this.currentMove] ||= []
			// Reduce ticket count
			this.remainingTickets[playerIndex][ticketType]--
			// Add sub-move to move
			this.turns[this.currentTurn][this.currentMove].push({
				ticket: this.ticketType,
				target: (ticketType === 5 ? undefined : target)	// Dont include target on double ticket
			})
			if (ticketType !== 5) {
				this.playerPlaces[playerIndex] = target
				// Only next move if its either 1 (single sub-move) or 3 (second sub-move of double)
				if (this.turns[this.currentTurn][this.currentMove].length !== 2) {
					this.currentMove++
				}
			}
		}
		return isValid
	}
}