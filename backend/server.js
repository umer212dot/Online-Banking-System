import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import authRoutes from './routes/authRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import billRoutes from './routes/billRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import { initializeSocket } from './socket.js';
import db from './config/db.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

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
app.use('/api/admin/users', adminUserRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Backend running with MySQL');
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await db.query('SELECT 1'); // verify DB connection before starting
    console.log('MySQL connected');

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  }
};

startServer();
