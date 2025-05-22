const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: process.env.NODE_ENV === 'production' ? {
    tls: true,
    rejectUnauthorized: false,
  } : undefined,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("✅ Redis connected");
    }
  } catch (err) {
    console.error("❌ Redis connection error:", err);
  }
})();

module.exports = redisClient;