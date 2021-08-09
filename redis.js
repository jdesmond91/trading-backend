const config = require('./utils/config')
const asyncRedis = require('async-redis')

const asyncRedisClient = asyncRedis.createClient(config.REDIS_PORT)

module.exports = asyncRedisClient
