const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "club_registration",
  password: "shyam",
  port: 5432,
});


module.exports = pool;
