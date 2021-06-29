const Order = require('../models/order')
const Security = require('../models/security')
const ordersRouter = require('express').Router()
const logger = require('../utils/logger')

ordersRouter.get('/', async (req, res) => {
	try {
		const orders = await Order.find({})
		res.status(200).json(orders)
	} catch (err) {
		const message = 'Could not retreive orders from database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
})

ordersRouter.post('/', async (req, res) => {
	try {
		const newOrder = new Order({
			type: req.body.type,
			submitDate: new Date(),
			security: req.body.securityId,
			price: req.body.price,
			quantity: req.body.quantity,
		})

		await newOrder.save()
		res.status(201).json(newOrder)
	} catch (err) {
		const message = 'Could not save new order to database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
})

module.exports = ordersRouter
