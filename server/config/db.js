const { Pool } = require("pg");
require("dotenv").config();

const poolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

if (process.env.NODE_ENV === "production") {
  poolConfig.ssl = { rejectUnauthorized: false }; // Enable SSL in production (e.g., Render)
} else {
  poolConfig.ssl = false; // Disable SSL in development (local)
}

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err.message, err.stack);
});

module.exports = pool;