const Position = require('../models/position')
const Order = require('../models/order')
const Security = require('../models/security')
const Transaction = require('../models/transaction')
const logger = require('../utils/logger')
const yahooFinance = require('yahoo-finance2').default
const asyncRedisClient = require('../redis')

const round = (num) => {
	return parseFloat((Math.round((num + Number.EPSILON) * 100) / 100).toFixed(2))
}

const getSecurity = async (id) => {
	try {
		const security = await Security.findById(id)
		if (security) return security
		else throw new Error('Cannot retrieve security from database')
	} catch (err) {
		throw err
	}
}

const getSecurityPrice = async (ticker) => {
	try {
		let securityPrice

		// attempt to retrive from redis cache
		securityPrice = await asyncRedisClient.get(`prices?ticker=${ticker}`)

		// if there isn't anything in the cache, retrieve price from yahoo finance
		if (!securityPrice) {
			logger.info('No cached price found, retrieving from yahoo finance')
			const quote = await yahooFinance.quote(ticker)
			securityPrice = round(quote.regularMarketPrice)
			await asyncRedisClient.setex(`prices?ticker=${ticker}`, 3600, JSON.stringify(securityPrice))
		}

		return securityPrice
	} catch (err) {
		throw err
	}
}

const deposit = async (securityId, quantity, position) => {
	try {
		logger.info('Initiating DEPOSIT')

		let newPosition

		// if there is an existing position, add the new quantity to the current quantity
		if (position) {
			const total = quantity + position.quantity

			// new set to true will return the updated position rather than the original position
			newPosition = await Position.findByIdAndUpdate(
				position.id,
				{ quantity: total, bookValue: total },
				{
					new: true,
				}
			)
			await newPosition.save()
			logger.info('Position successfully updated', newPosition)
		} else {
			// else create new position with the current quantity
			newPosition = new Position({
				security: securityId,
				quantity: quantity,
				bookValue: quantity,
			})

			await newPosition.save()
			logger.info('Position successfully inserted', newPosition)
		}
	} catch (err) {
		throw err
	}
}

const buy = async (securityId, quantity, total, position) => {
	try {
		logger.info('Initiating BUY')

		let newPosition

		// if there is an existing position, add the new quantity to the current quantity
		if (position) {
			// new set to true will return the updated position rather than the original position
			newPosition = await Position.findByIdAndUpdate(
				position.id,
				{ quantity: position.quantity + quantity, bookValue: position.bookValue + total },
				{
					new: true,
				}
			)
			await newPosition.save()
			logger.info('Position successfully updated', newPosition)
		} else {
			// else create a new position
			newPosition = new Position({
				security: securityId,
				quantity: quantity,
				bookValue: total,
			})
			await newPosition.save()
			logger.info('Position successfully inserted', newPosition)
		}
	} catch (err) {
		throw err
	}
}

const sell = async (securityId, quantity, total, position) => {
	try {
		logger.info('Initiating SELL')

		// if no position found to be sold, throw an error
		if (!position) {
			throw new Error('Cannot retrieve position from database')
		}

		// if you are trying to sell more positions than you own, throw an error
		if (position.quantity < quantity) {
			logger.error('Held position quantity', position.quantity)
			logger.error('Sell position quantity', quantity)
			throw new Error('Cannot sell more positions than held')
		}

		// if selling all positions, then delete the record from the database
		if (position.quantity - quantity === 0) {
			await Position.findByIdAndDelete(position.id)
			logger.info('Position successfully deleted')
		} else {
			// if only selling a subset of positions, then update the position quantity
			// new set to true will return the updated position rather than the original position
			let newPosition = await Position.findByIdAndUpdate(
				position.id,
				{ quantity: position.quantity - quantity, bookValue: position.bookValue - total },
				{
					new: true,
				}
			)
			await newPosition.save()
			logger.info('Position successfully updated', newPosition)
		}
	} catch (err) {
		throw err
	}
}

const upsertPosition = async (securityId, quantity, type, total) => {
	try {
		// attempt to find the position for the given security
		const position = await Position.findOne({ security: securityId })
		logger.info('Retrieved position', position)

		if (type === 'DEPOSIT') {
			await deposit(securityId, quantity, position)
		}

		if (type === 'BUY') {
			await buy(securityId, quantity, total, position)
		}

		if (type === 'SELL') {
			await sell(securityId, quantity, total, position)
		}
	} catch (err) {
		throw err
	}
}

const insertTransaction = async (type, quantity, price, orderId) => {
	try {
		let newTransaction

		if (type === 'DEPOSIT') {
			newTransaction = new Transaction({
				type: type,
				date: new Date(),
				quantity: quantity,
			})
		} else {
			// if BUY or SELL, then save the price and the order id as well
			newTransaction = new Transaction({
				type: type,
				date: new Date(),
				quantity: quantity,
				price: price,
				order: orderId,
			})
		}

		await newTransaction.save()
	} catch (err) {
		throw new Error('Could not save new transaction to database')
	}
}

const getCAD = async () => {
	try {
		const CAD = await Security.findOne({ name: 'Canadian Dollar' })
		if (CAD) return CAD.id
		else throw new Error('Could not retrieve CAD security from database')
	} catch (err) {
		throw err
	}
}

const getPosition = async (securityId) => {
	try {
		return await Position.findOne({ security: securityId })
	} catch (err) {
		logger.error(err)
		throw err
	}
}

const getCashPosition = async () => {
	try {
		const securityIdCAD = await getCAD()
		return await getPosition(securityIdCAD)
	} catch (err) {
		throw err
	}
}

const updateCashPosition = async (cashPosition, total, type) => {
	// subtract from cash if its a BUY, add to cash if its a SELL or DEPOSIT
	if (type === 'BUY') {
		cashPosition.quantity = cashPosition.quantity - total
		cashPosition.bookValue = cashPosition.bookValue - total
	} else {
		cashPosition.quantity = cashPosition.quantity + total
		cashPosition.bookValue = cashPosition.bookValue + total
	}
	await cashPosition.save()
}

const getPositions = async () => {
	try {
		return await Position.find({}).populate('security')
	} catch (err) {
		throw err
	}
}

const getSecurityPositions = (positions) => {
	let securityPositions = []
	if (positions.length > 0) {
		securityPositions = positions.filter((position) => position.security.type === 'EQUITY')
	}
	return securityPositions
}

const getPositionsWithMarketValue = async (positions) => {
	let positionsWithMarketValue = []
	if (positions.length > 0) {
		positionsWithMarketValue = await Promise.all(
			// for every position, get the current security price and multiply by quantity to get market value
			positions.map(async (position) => {
				try {
					const positionWithMarketValue = position.toObject()
					const securityPrice = await getSecurityPrice(positionWithMarketValue.security.ticker)
					const marketValue = round(position.quantity * securityPrice)
					return { ...positionWithMarketValue, marketValue: marketValue }
				} catch (err) {
					throw err
				}
			})
		)
	}
	return positionsWithMarketValue
}

module.exports = {
	round,
	getSecurity,
	getSecurityPrice,
	upsertPosition,
	insertTransaction,
	getCAD,
	getPosition,
	getCashPosition,
	getPositions,
	getSecurityPositions,
	getPositionsWithMarketValue,
	updateCashPosition,
}
