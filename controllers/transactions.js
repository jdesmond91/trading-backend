const Transaction = require('../models/transaction')
const transactionsRouter = require('express').Router()
const { upsertPosition, getCAD } = require('./helpers')
const logger = require('../utils/logger')

transactionsRouter.get('/', async (req, res) => {
	try {
		const transactions = await Transaction.find({}).populate({
			path: 'order',
			populate: { path: 'security' },
		})
		res.status(200).json(transactions)
	} catch (err) {
		const message = 'Could not retreive orders from database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
})

transactionsRouter.post('/deposit', async (req, res) => {
	try {
		const newTransaction = new Transaction({
			type: 'DEPOSIT',
			date: new Date(),
			amount: req.body.amount,
		})

		await newTransaction.save()

		// save CAD cash position
		try {
			const securityIdCAD = await getCAD()
			upsertPosition(securityIdCAD, req.body.amount)
		} catch (err) {
			const message = 'Could not save new position to database'
			logger.error({
				message: message,
				error: err,
			})
			res.status(400).json(message)
		}

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
