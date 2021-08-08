const Order = require('../models/order')
const ordersRouter = require('express').Router()
const {
	getSecurity,
	getSecurityPrice,
	upsertPosition,
	insertTransaction,
	getCashPosition,
	updateCashPosition,
} = require('./helpers')
const logger = require('../utils/logger')

ordersRouter.get('/', async (req, res) => {
	try {
		const orders = await Order.find({}).populate('security')
		res.status(200).json(orders)
	} catch (err) {
		const message = 'Could not retrieve orders from database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
})

ordersRouter.post('/', async (req, res) => {
	try {
		let cashPosition

		const security = await getSecurity(req.body.securityId)
		const securityPrice = await getSecurityPrice(security.ticker)

		if (req.body.quantity <= 0) {
			throw new Error('Quantity must be greater than zero')
		}

		const id = security._id
		const quantity = req.body.quantity
		const total = securityPrice * quantity
		const type = req.body.type

		const newOrder = new Order({
			type: type,
			submitDate: new Date(),
			security: id,
			price: securityPrice,
			quantity: quantity,
		})

		cashPosition = await getCashPosition()

		if (!cashPosition) {
			throw new Error('Could not retrieve cash position from database')
		}

		// if the order is a buy, ensure there is enough cash to complete it
		if (type === 'BUY') {
			if (cashPosition.quantity < total) throw new Error('Not enough cash to complete order!')
		}

		/* 
        1. Save the order
        2. Update the security position
        3. Insert a new transaction
        4. Update the cash position
        */

		await newOrder.save()

		try {
			await upsertPosition(id, quantity, type, total)
			await insertTransaction(type, quantity, securityPrice, newOrder.id)
		} catch (err) {
			logger.error(err)
			throw new Error('Could not save position or transaction to database')
		}

		await updateCashPosition(cashPosition, total, type)

		res.status(201).json(newOrder)
	} catch (err) {
		logger.error(err)
		res.status(400).json(err.message)
	}
})

module.exports = ordersRouter
