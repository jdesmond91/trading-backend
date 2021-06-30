const Position = require('../models/position')
const Order = require('../models/order')
const Security = require('../models/security')
const logger = require('../utils/logger')

const upsertPosition = async (securityId, quantity) => {
	const position = await Position.findOne({ security: securityId })

	// if there is an existing position, add the new quantity to the current quantity
	// else create new position with the current quantity
	if (position) {
		// new set to true will return the updated position rather than the original position
		const updatedPosition = await Position.findByIdAndUpdate(
			position.id,
			{ quantity: quantity + position.quantity },
			{
				new: true,
			}
		)

		await updatedPosition.save()
	} else {
		const newPosition = new Position({
			security: securityId,
			quantity: quantity,
		})

		await newPosition.save()
	}
}

const getCAD = async () => {
	try {
		const CAD = await Security.findOne({ name: 'Canadian Dollar' })
		return CAD.id
	} catch (err) {
		const message = 'Could not retreive CAD from database'
		logger.error({
			message: message,
			error: err,
		})
		res.status(400).json(message)
	}
}

const validateOrder = async () => {}

module.exports = { upsertPosition, getCAD }
