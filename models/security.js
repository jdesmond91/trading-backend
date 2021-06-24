const mongoose = require('mongoose')

const securitySchema = new mongoose.Schema({
	name: { type: String, required: true, maxlength: 100 },
	ticker: { type: String, required: true, maxlength: 5 },
	price: { type: Number, required: true },
})

// export compiled model based on the above schema
module.exports = mongoose.model('Security', securitySchema)
