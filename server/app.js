const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

// Clear module cache (useful during development, but remove in production)
// if (process.env.NODE_ENV !== "production") {
//   Object.keys(require.cache).forEach((key) => {
//     delete require.cache[key];
//   });
// }


const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test the database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.stack);
        process.exit(1);
    } else {
        console.log('✅ Connected to database');
        release();
    }
});

module.exports = pool;



// Middleware, routes, etc.
console.log('Starting server...');
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
});


// Define allowed origins
const allowedOrigins = [
  "http://localhost:3000", // Development
  "https://psg-hive.vercel.app",
  "https://psg-hive-shyam-gks-projects.vercel.app",
  "https://psg-hive-git-main-shyam-gks-projects.vercel.app",
];

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Postman, mobile apps) or from allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin || "*"); // Return specific origin or "*" for non-browser requests
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // Remove 'Credentials' as it's not needed
  })
);

// Parse cookies
app.use(cookieParser());

// Parse JSON bodies
app.use(express.json());

// Redis Connection
require("./config/redis");

// Routes
const studentRoutes = require("./routes/studentRoutes");
const clubRoutes = require("./routes/clubRoutes");
const eventRoutes = require("./routes/eventRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const attendanceRoutes = require("./routes/attRoutes");
const allotmentRoutes = require("./routes/allotmentRoutes");
const profileRoutes = require("./routes/profileRoutes");

app.use("/student", studentRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/allotment", allotmentRoutes);
app.use("/api/profile", profileRoutes);

// Error handler middleware
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

module.exports = app;