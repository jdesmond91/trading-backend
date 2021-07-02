const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
	type: { type: String, require: true },
	date: { type: Date, required: true },
	quantity: { type: Number, required: true },
	order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
})

// when toJSON is called, delete mongoose id and version and return id as string
transactionSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	},
})

module.exports = mongoose.model('Transaction', transactionSchema)
