const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const config = require('./utils/config')
const securitiesRouter = require('./controllers/securities')
const ordersRouter = require('./controllers/orders')
const transactionsRouter = require('./controllers/transactions')
const positionsRouter = require('./controllers/positions')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')

const app = express()

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

app.use(cors())
app.use(express.json()) // allow for parsing of incoming JSON objects during POST requests - attaches request JSON data to body property of request objects
app.use(middleware.requestLogger)
app.use('/api/trading/securities', securitiesRouter)
app.use('/api/trading/orders', ordersRouter)
app.use('/api/trading/transactions', transactionsRouter)
app.use('/api/trading/positions', positionsRouter)
app.use(middleware.unknownEndpoint)

module.exports = app
