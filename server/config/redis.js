const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
  // No TLS — Redis Cloud on Render is using plain TCP on port 17580
  // DO NOT set `socket.tls` here
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
