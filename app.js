const express = require('express')
const mongoose = require('mongoose')
const config = require('./utils/config')

const app = express()

// allow for parsing of incoming JSON objects during POST requests
// attaches request JSON data to body property of request objects
app.use(express.json())

mongoose.connect(config.MONGODB_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	useCreateIndex: true,
})

app.listen(config.PORT, () => {
	console.log(`App running on port ${config.PORT}`)
})
