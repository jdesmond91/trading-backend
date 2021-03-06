const mongoose = require('mongoose')

const securitySchema = new mongoose.Schema({
	name: { type: String, required: true, maxlength: 100 },
	ticker: { type: String, required: true, maxlength: 8 },
	type: { type: String, require: true },
})

// when toJSON is called, delete mongoose id and version and return id as string
securitySchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	},
})

// when toObject is called, delete mongoose id and version and return id as string
securitySchema.set('toObject', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	},
})

// export compiled model based on the above schema
module.exports = mongoose.model('Security', securitySchema)
