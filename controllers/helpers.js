const Position = require('../models/position')
const Order = require('../models/order')
const Security = require('../models/security')
const Transaction = require('../models/transaction')
const logger = require('../utils/logger')
const yahooFinance = require('yahoo-finance2').default
const asyncRedisClient = require('../redis')

const round = (num) => {
	var m = Number((Math.abs(num) * 100).toPrecision(15))
	return (Math.round(m) / 100) * Math.sign(num)
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
			logger.info('No cache price found, retrieving from yahoo finance')
			const quote = await yahooFinance.quote(ticker)
			securityPrice = round(quote.regularMarketPrice)
			await asyncRedisClient.setex(`prices?ticker=${ticker}`, 3600, JSON.stringify(securityPrice))
		}

		return securityPrice
	} catch (err) {
		throw err
	}
}

const upsertPosition = async (securityId, quantity, type, total) => {
	const position = await Position.findOne({ security: securityId })
	let newPosition

	logger.info('Retrieved position', position)

	if (type === 'DEPOSIT') {
		logger.info('Initiating DEPOSIT')
		// if there is an existing position, add the new quantity to the current quantity
		// else create new position with the current quantity
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
			newPosition = new Position({
				security: securityId,
				quantity: quantity,
				bookValue: quantity,
			})

			await newPosition.save()
			logger.info('Position successfully inserted', newPosition)
		}
		return newPosition
	}

	if (type === 'BUY') {
		logger.info('Initiating BUY')
		// if there is an existing position, add the new quantity to the current quantity
		// else create new position with the current quantity
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
			newPosition = new Position({
				security: securityId,
				quantity: quantity,
				bookValue: total,
			})
			await newPosition.save()
			logger.info('Position successfully inserted', newPosition)
		}
		return newPosition
	}

	if (type === 'SELL') {
		logger.info('Initiating SELL')
		// if selling all positions, then delete the record from the database
		if (position.quantity - quantity === 0) {
			await Position.findByIdAndDelete(position.id)
			logger.info('Position successfully deleted')
		} else if (position.quantity < quantity) {
			logger.error('Held position quantity', position.quantity)
			logger.error('Sell position quantity', quantity)
			throw new Error('Cannot sell more positions than held')
		} else {
			// if only selling a subset of positions, then update the position quantity
			// new set to true will return the updated position rather than the original position
			newPosition = await Position.findByIdAndUpdate(
				position.id,
				{ quantity: position.quantity - quantity, bookValue: position.bookValue - total },
				{
					new: true,
				}
			)
			await newPosition.save()
			logger.info('Position successfully updated', newPosition)
		}
		return newPosition
	} else {
		throw new Error('Cannot retrieve position from database')
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
				order: orderId,
			})
		} else {
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
		const message = 'Could not save new transaction to database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
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

module.exports = {
	getSecurity,
	getSecurityPrice,
	upsertPosition,
	insertTransaction,
	getCAD,
	getPosition,
	getCashPosition,
	updateCashPosition,
}
