import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import billRoutes from './routes/billRoutes.js';
import db from './config/db.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // frontend origin
  credentials: true,               // allow cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/bill', billRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Backend running with MySQL');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await db.query('SELECT 1'); // test DB connection
    console.log('MySQL connected');
  } catch (err) {
    console.error('MySQL connection error:', err);
  }
  console.log(`Server running on port ${PORT}`);
});
