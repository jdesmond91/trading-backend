const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const mongoose = require('mongoose')
const Security = require('../models/security')
const config = require('../utils/config')

describe('Security Tests', () => {
	beforeAll(async () => {
		await mongoose.connect(config.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
			useCreateIndex: true,
		})
	})

	test('/POST should create a security successfully', async () => {
		const newSecurity = {
			name: 'Securities Test',
			ticker: 'ST',
			price: 100,
		}

		await api
			.post('/api/securities')
			.send(newSecurity)
			.expect(201)
			.expect('Content-Type', /application\/json/)

		const securities = await api.get('/api/securities')
		const securityNames = securities.body.map((security) => security.name)
		expect(securityNames).toContain('Securities Test')
	})

	test('/GET should return at least one security in json format', async () => {
		await api.get('/api/securities').expect('Content-Type', /json/).expect(200)
	})

	test('/DELETE should delete a security successfully', async () => {
		const testSecurity = await Security.findOne({ name: 'Securities Test' })
		console.log(testSecurity)
		await api.delete(`/api/securities/${testSecurity.id}/`).expect(204)

		const securities = await api.get('/api/securities')
		const securityNames = securities.body.map((security) => security.name)
		expect(securityNames).not.toContain('Securities Test')
	})

	afterAll(async () => {
		await mongoose.connection.close()
	})
})
