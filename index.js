import express from 'express'

const app = express()

// allow for parsing of incoming JSON objects during POST requests
// attaches request JSON data to body property of request objects
app.use(express.json())

// logging middleware
const requestLogger = (request, response, next) => {
	console.log('Method:', request.method)
	console.log('Path:  ', request.path)
	console.log('Body:  ', request.body)
	console.log('---')
	next()
}

app.use(requestLogger)

let notes = [
	{
		id: 1,
		content: 'HTML is easy',
		date: '2019-05-30T17:30:31.098Z',
		important: true,
	},
	{
		id: 2,
		content: 'Browser can execute only Javascript',
		date: '2019-05-30T18:39:34.091Z',
		important: false,
	},
	{
		id: 3,
		content: 'GET and POST are the most important methods of HTTP protocol',
		date: '2019-05-30T19:20:14.298Z',
		important: true,
	},
]

app.get('/', (req, res) => {
	res.send('hello world')
})

app.get('/api/notes', (req, res) => {
	res.send(JSON.stringify(notes))
})

// middleware to catch requests made to undefined routes
const unknownEndpoint = (request, response) => {
	response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = 3001

app.listen(PORT, () => {
	console.log(`Application is running on port ${PORT}`)
})
