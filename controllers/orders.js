const Order = require('../models/order')
const Position = require('../models/position')
const Transaction = require('../models/transaction')
const ordersRouter = require('express').Router()
const { upsertPosition } = require('./helpers')
const logger = require('../utils/logger')

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

ordersRouter.get('/', async (req, res) => {
	try {
		const orders = await Order.find({}).populate('security')
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

		try {
			upsertPosition(req.body.securityId, req.body.quantity)
		} catch (err) {
			const message = 'Could not save new position to database'
			logger.error({
				message: message,
				error: err,
			})
			res.status(400).json(message)
		}

		await newOrder.save()

		// create a new transaction with the order
		insertTransaction(req.body.type, req.body.price * req.body.quantity, newOrder.id)
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
