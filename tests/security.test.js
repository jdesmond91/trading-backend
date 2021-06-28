const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

describe('Security Tests', () => {
	test('/GET should return at least one security in json format', async () => {
		await api.get('/api/securities').expect('Content-Type', /json/).expect(200)
	})
})
