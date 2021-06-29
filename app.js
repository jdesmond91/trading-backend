const express = require('express')
const mongoose = require('mongoose')
const config = require('./utils/config')
const securitiesRouter = require('./controllers/securities')
const logger = require('./utils/logger')

const app = express()

// allow for parsing of incoming JSON objects during POST requests
// attaches request JSON data to body property of request objects
app.use(express.json())
app.use('/api/securities', securitiesRouter)

mongoose
	.connect(config.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true,
	})
	.then(() => {
		logger.info('Connected to MongoDB')
		app.listen(config.PORT, () => {
			logger.info(`App running on port ${config.PORT}`)
		})
	})
	.catch((error) => {
		logger.error('Error connecting to MongoDB:', error.message)
	})

module.exports = app
