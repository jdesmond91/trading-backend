const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const mongoose = require('mongoose')
const Security = require('../models/security')
const Order = require('../models/order')
const Position = require('../models/position')
const Transaction = require('../models/transaction')
const config = require('../utils/config')
const { getCashPosition, getPosition } = require('../controllers/helpers')

beforeAll(async () => {
	await mongoose.connect(config.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true,
	})

	await Order.deleteMany({})
	await Transaction.deleteMany({})
})

describe('Security Tests', () => {
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
		//console.log(testSecurity)
		await api.delete(`/api/securities/${testSecurity.id}/`).expect(204)

		const securities = await api.get('/api/securities')
		const securityNames = securities.body.map((security) => security.name)
		expect(securityNames).not.toContain('Securities Test')
	})
})

describe('Transaction Tests', () => {
	beforeAll(async () => {
		const cashPosition = await getCashPosition()
		if (cashPosition) {
			await Position.findByIdAndDelete(cashPosition.id)
		}
	})

	describe('/DEPOSIT Tests', () => {
		test('/DEPOSIT should deposit new cash position', async () => {
			await api
				.post('/api/transactions/deposit')
				.send({
					quantity: 1000,
				})
				.expect(201)
				.expect('Content-Type', /application\/json/)

			const cashPosition = await getCashPosition()
			expect(cashPosition.quantity).toBe(1000)
		})

		test('/DEPOSIT should update existing cash position', async () => {
			await api
				.post('/api/transactions/deposit')
				.send({
					quantity: 1000,
				})
				.expect(201)
				.expect('Content-Type', /application\/json/)

			const cashPosition = await getCashPosition()
			expect(cashPosition.quantity).toBe(2000)
		})
	})
})

describe('Position Tests', () => {
	let cashPosition

	beforeAll(async () => {
		cashPosition = await getCashPosition()
	})

	test('should retrieve cash position successfully', async () => {
		await api
			.get('/api/positions/cash')
			.expect(200)
			.expect('Content-Type', /application\/json/)
	})
})

describe('Order Tests', () => {
	let testSecurity
	let initialOrders
	let initialPositions
	let initialTransactions

	let testPrice = 100
	let testQuantity = 5
	let total = testPrice * testQuantity

	beforeAll(async () => {
		testSecurity = await Security.findOne({ ticker: 'RY' })
		await Position.findOneAndDelete({ security: testSecurity._id })

		initialOrders = await api.get('/api/orders')
		initialPositions = await api.get('/api/positions')
		initialTransactions = await api.get('/api/transactions')
	})

	test('/POST buy should create a new position', async () => {
		await api
			.post('/api/orders/')
			.send({
				type: 'BUY',
				securityId: testSecurity._id,
				price: testPrice,
				quantity: testQuantity,
			})
			.expect(201)
			.expect('Content-Type', /application\/json/)

		const orders = await api.get('/api/orders')
		const positions = await api.get('/api/positions')
		const transactions = await api.get('/api/transactions')

		expect(orders.body).toHaveLength(initialOrders.body.length + 1)
		expect(positions.body).toHaveLength(initialPositions.body.length + 1)
		expect(transactions.body).toHaveLength(initialTransactions.body.length + 1)
	})

	test('/POST buy should update security and cash positions', async () => {
		const initialCashPosition = await getCashPosition()
		const initialSecurityPosition = await getPosition(testSecurity._id)

		await api
			.post('/api/orders/')
			.send({
				type: 'BUY',
				securityId: testSecurity._id,
				price: testPrice,
				quantity: testQuantity,
			})
			.expect(201)
			.expect('Content-Type', /application\/json/)

		const cashPosition = await getCashPosition()
		const securityPosition = await getPosition(testSecurity._id)

		expect(cashPosition.quantity).toBe(initialCashPosition.quantity - total)
		expect(securityPosition.quantity).toBe(initialSecurityPosition.quantity + testQuantity)
		expect(securityPosition.totalValue).toBe(initialSecurityPosition.totalValue + total)
	})

	test('/POST sell should update security and cash positions', async () => {
		const initialCashPosition = await getCashPosition()
		const initialSecurityPosition = await getPosition(testSecurity._id)

		await api
			.post('/api/orders/')
			.send({
				type: 'SELL',
				securityId: testSecurity._id,
				price: testPrice,
				quantity: testQuantity,
			})
			.expect(201)
			.expect('Content-Type', /application\/json/)

		const cashPosition = await getCashPosition()
		const securityPosition = await getPosition(testSecurity._id)

		expect(cashPosition.quantity).toBe(initialCashPosition.quantity + total)
		expect(securityPosition.quantity).toBe(initialSecurityPosition.quantity - testQuantity)
		expect(securityPosition.totalValue).toBe(initialSecurityPosition.totalValue - total)
	})

	test('/POST selling more positions than you currently hold results in error', async () => {
		testQuantity = 15

		await api
			.post('/api/orders/')
			.send({
				type: 'SELL',
				securityId: testSecurity._id,
				price: testPrice,
				quantity: testQuantity,
			})
			.expect(400)
			.expect('Content-Type', /application\/json/)
	})

	test('/POST sell should delete the position if sell quantity is equal to held quantity', async () => {
		const initialCashPosition = await getCashPosition()
		const initialSecurityPosition = await getPosition(testSecurity._id)

		testQuantity = 5

		await api
			.post('/api/orders/')
			.send({
				type: 'SELL',
				securityId: testSecurity._id,
				price: testPrice,
				quantity: testQuantity,
			})
			.expect(201)
			.expect('Content-Type', /application\/json/)

		const cashPosition = await getCashPosition()
		const securityPosition = await getPosition(testSecurity._id)

		expect(cashPosition.quantity).toBe(initialCashPosition.quantity + total)
		expect(securityPosition).toBe(null)
	})
})

afterAll(async () => {
	await mongoose.connection.close()
})
