const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
	type: { type: String },
	submitDate: { type: Date, required: true },
	security: { type: mongoose.Schema.Types.ObjectId, ref: 'Security', required: true },
	price: { type: Number },
	quantity: { type: Number },
})

// when toJSON is called, delete mongoose id and version and return id as string
orderSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	},
})

module.exports = mongoose.model('Order', orderSchema)
