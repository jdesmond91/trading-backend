const Order = require('../models/order')
const ordersRouter = require('express').Router()
const {
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
		const total = req.body.price * req.body.quantity
		const type = req.body.type

		const newOrder = new Order({
			type: req.body.type,
			submitDate: new Date(),
			security: req.body.securityId,
			price: req.body.price,
			quantity: req.body.quantity,
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
			await upsertPosition(req.body.securityId, req.body.quantity, type)
			await insertTransaction(req.body.type, total, newOrder.id)
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
