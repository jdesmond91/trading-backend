const Position = require('../models/position')
const positionsRouter = require('express').Router()
const logger = require('../utils/logger')
const { getCashPosition } = require('./helpers')

positionsRouter.get('/', async (req, res) => {
	try {
		const positions = await Position.find({})
		res.status(200).json(positions)
	} catch (err) {
		const message = 'Could not retrieve positions from database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
})

positionsRouter.get('/cash', async (req, res) => {
	try {
		const cash = await getCashPosition()
		res.status(200).json(cash)
	} catch (err) {
		const message = 'Could not retrieve cash position from database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
})

module.exports = positionsRouter
