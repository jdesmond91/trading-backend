const Position = require('../models/position')
const Order = require('../models/order')
const Security = require('../models/security')
const Transaction = require('../models/transaction')
const logger = require('../utils/logger')

const upsertPosition = async (securityId, quantity) => {
	const position = await Position.findOne({ security: securityId })

	// if there is an existing position, add the new quantity to the current quantity
	// else create new position with the current quantity
	if (position) {
		// new set to true will return the updated position rather than the original position
		const updatedPosition = await Position.findByIdAndUpdate(
			position.id,
			{ quantity: quantity + position.quantity },
			{
				new: true,
			}
		)

		await updatedPosition.save()
	} else {
		const newPosition = new Position({
			security: securityId,
			quantity: quantity,
		})

		await newPosition.save()
	}
}

const insertTransaction = async (type, amount, orderId) => {
	try {
		const newTransaction = new Transaction({
			type: type,
			date: new Date(),
			amount: amount,
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

const getCashPosition = async () => {
	try {
		const securityIdCAD = await getCAD()
		const cash = await Position.findOne({ security: securityIdCAD })
		if (cash) return cash
		else throw new Error('Could not retrieve cash position from database')
	} catch (err) {
		throw err
	}
}

const updateCashPosition = async (cashPosition, total, orderType) => {
	// subtract from cash if its a BUY, add to cash if its a SELL
	cashPosition.quantity =
		orderType === 'BUY' ? cashPosition.quantity - total : cashPosition.quantity + total
	await cashPosition.save()
}

module.exports = {
	upsertPosition,
	insertTransaction,
	getCAD,
	getCashPosition,
	updateCashPosition,
}
