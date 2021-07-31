const Transaction = require('../models/transaction')
const transactionsRouter = require('express').Router()
const { upsertPosition, getCAD } = require('./helpers')
const logger = require('../utils/logger')

transactionsRouter.get('/', async (req, res) => {
	try {
		const transactions = await Transaction.find({})
			.populate({
				path: 'order',
				populate: { path: 'security' },
			})
			.sort({ date: 'desc' })
		res.status(200).json(transactions)
	} catch (err) {
		const message = 'Could not retrieve orders from database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
})

transactionsRouter.post('/deposit', async (req, res) => {
	try {
		const type = 'DEPOSIT'
		const newTransaction = new Transaction({
			type: type,
			date: new Date(),
			quantity: req.body.quantity,
		})

		// save CAD cash position
		try {
			const securityIdCAD = await getCAD()
			upsertPosition(securityIdCAD, req.body.quantity, type)
		} catch (err) {
			const message = 'Could not save new position to database'
			logger.error({
				message: message,
				error: err,
			})
			res.status(400).json(message)
		}

		await newTransaction.save()
		res.status(201).json(newTransaction)
	} catch (err) {
		const message = 'Could not save new transaction to database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
})

module.exports = transactionsRouter
