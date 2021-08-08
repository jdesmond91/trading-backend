const mongoose = require('mongoose')

const positionSchema = new mongoose.Schema({
	security: { type: mongoose.Schema.Types.ObjectId, ref: 'Security', required: true },
	quantity: { type: Number, required: true },
	bookValue: { type: Number, required: true },
})

// when toJSON is called, delete mongoose id and version and return id as string
positionSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	},
})

module.exports = mongoose.model('Position', positionSchema)
