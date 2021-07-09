const Position = require('../models/position')
const positionsRouter = require('express').Router()
const logger = require('../utils/logger')
const { getCashPosition } = require('./helpers')

positionsRouter.get('/', async (req, res) => {
	try {
		const positions = await Position.find({}).populate('security')
		const securityPositions = positions.filter((position) => position.security.type !== 'CASH')
		res.status(200).json(securityPositions)
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

positionsRouter.get('/networth', async (req, res) => {
	try {
		const positions = await Position.find({})
		const netWorth = positions.reduce(
			(accumulator, currentValue) => accumulator + currentValue.totalValue,
			0
		)
		res.status(200).json(netWorth)
	} catch (err) {
		const message = 'Could not retrieve net worth from database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
})

module.exports = positionsRouter
