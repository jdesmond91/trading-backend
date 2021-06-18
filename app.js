const express = require('express')
const mongoose = require('mongoose')
const config = require('./utils/config')
const logger = require('./utils/logger')

const app = express()

// allow for parsing of incoming JSON objects during POST requests
// attaches request JSON data to body property of request objects
app.use(express.json())

mongoose
	.connect(config.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true,
	})
	.then(() => {
		logger.info('Connected to MongoDB')
	})
	.catch((error) => {
		logger.error('Error connecting to MongoDB:', error.message)
	})

app.listen(config.PORT, () => {
	logger.info(`App running on port ${config.PORT}`)
})
