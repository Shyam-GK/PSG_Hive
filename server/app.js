const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

// Clear module cache (useful during development)
Object.keys(require.cache).forEach((key) => {
  delete require.cache[key];
});

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://psg-hive.vercel.app",
  "https://psg-hive-shyam-gks-projects.vercel.app",
  "https://psg-hive-git-main-shyam-gks-projects.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Credentials', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));


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
const profileRoutes = require('./routes/profileRoutes')

app.use("/student", studentRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/allotment", allotmentRoutes);
app.use('/api/profile',profileRoutes)
// Error handler middleware
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

module.exports = app;