const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // Connect to PostgreSQL
    await pool.connect();
    console.log("🔥🔥🔥 PostgreSQL connected");

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err.message, err.stack);
    process.exit(1);
  }
})();