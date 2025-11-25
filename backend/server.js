import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import billRoutes from './routes/billRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import db from './config/db.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/bill', billRoutes);
app.use('/api/notifications', notificationRoutes);

// Debug: Log registered routes
console.log('Auth routes registered at /api/auth');

// Test route
app.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1'); // test DB connection
    res.send('Backend running with MySQL: Connected!');
  } catch (err) {
    console.error('MySQL connection error:', err);
    res.status(500).send('Database connection failed');
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
