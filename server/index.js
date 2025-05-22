const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./server/routes/authRoutes');
const pool = require('./server/config/db');

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://psg-hive.vercel.app",
  "https://psg-hive-shyam-gks-projects.vercel.app",
  "https://psg-hive-git-main-shyam-gks-projects.vercel.app"
];
app.options("*", cors());
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

app.use(express.json());

pool.connect()
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

app.get('/', (req, res) => {
  res.send('API is running');
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});
