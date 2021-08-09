const Position = require('../models/position')
const positionsRouter = require('express').Router()
const logger = require('../utils/logger')
const { getCashPosition, getSecurityPrice } = require('./helpers')

positionsRouter.get('/', async (req, res) => {
	try {
		const positions = await Position.find({}).populate('security')
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

positionsRouter.get('/equity', async (req, res) => {
	try {
		const positions = await Position.find({}).populate('security')
		let securityPositions = []
		if (positions.length > 0) {
			securityPositions = positions.filter((position) => position.security.type === 'EQUITY')
		}
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
		const cashPosition = await getCashPosition()
		const cash = cashPosition && cashPosition.bookValue > 0 ? cashPosition.bookValue : 0
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
		const positions = await Position.find({}).populate('security')
		let netWorth = { bookValue: 0, marketValue: 0 }

		if (positions.length > 0) {
			// 1. get cash position book value
			const cashPosition = positions.find(
				(position) => position.security.name === 'Canadian Dollar'
			)

			// 2. if exists add the cash position book value to running totals for bookValue and marketValue
			if (cashPosition) {
				netWorth.bookValue += cashPosition.bookValue
				netWorth.marketValue += cashPosition.bookValue
			}

			// 3. get a list of security positions
			const securityPositions = positions.filter((position) => position.security.type === 'EQUITY')

			if (securityPositions.length > 0) {
				// 4. loop through the list, and for each security, get the current price
				// 5. as you are looping, multiply the current price by the held quantity to get marketValue
				// 6. keep adding each marketValue to running totals for bookValue and marketValue

				for (const position of securityPositions) {
					const securityPrice = await getSecurityPrice(position.security.ticker)
					const positionMarketValue = position.quantity * securityPrice
					netWorth.marketValue += positionMarketValue

					netWorth.bookValue += position.bookValue
				}
			}
		}
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
