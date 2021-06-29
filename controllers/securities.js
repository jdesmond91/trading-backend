const Security = require('../models/security')
const securitiesRouter = require('express').Router()
const logger = require('../utils/logger')

securitiesRouter.get('/', async (req, res) => {
	try {
		const securities = await Security.find({})
		res.status(200).json(securities)
	} catch (err) {
		const message = 'Could not retreive securities from database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
})

securitiesRouter.post('/', async (req, res) => {
	const newSecurity = new Security({
		name: req.body.name,
		ticker: req.body.ticker,
		price: req.body.price,
	})

	try {
		await newSecurity.save()
		res.status(201).json(newSecurity)
	} catch (err) {
		const message = 'Could not save new security to database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
})

securitiesRouter.delete('/:id', async (req, res) => {
	try {
		await Security.findByIdAndDelete(req.params.id)
		res.status(204).end()
	} catch (err) {
		const message = 'Could not delete security from database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
})

module.exports = securitiesRouter
