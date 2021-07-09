const Position = require('../models/position')
const Order = require('../models/order')
const Security = require('../models/security')
const Transaction = require('../models/transaction')
const logger = require('../utils/logger')

const getSecurityPrice = async (securityId) => {
	try {
		const security = await Security.findById(securityId)
		return security.price
	} catch (err) {
		throw new Error('Could not retrieve security from database')
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
				{ quantity: total, totalValue: total },
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
				totalValue: quantity,
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
				{ quantity: position.quantity + quantity, totalValue: position.totalValue + total },
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
				totalValue: total,
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
			logger.error('Sell osition quantity', quantity)
			throw new Error('Cannot sell more positions than held')
		} else {
			// if only selling a subset of positions, then update the position quantity
			// new set to true will return the updated position rather than the original position
			newPosition = await Position.findByIdAndUpdate(
				position.id,
				{ quantity: position.quantity - quantity, totalValue: position.totalValue - total },
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

const insertTransaction = async (type, quantity, orderId) => {
	try {
		const newTransaction = new Transaction({
			type: type,
			date: new Date(),
			quantity: quantity,
			order: orderId,
		})

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
	cashPosition.quantity =
		type === 'BUY' ? cashPosition.quantity - total : cashPosition.quantity + total
	await cashPosition.save()
}

module.exports = {
	getSecurityPrice,
	upsertPosition,
	insertTransaction,
	getCAD,
	getPosition,
	getCashPosition,
	updateCashPosition,
}
