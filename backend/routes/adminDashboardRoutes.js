import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/', getDashboardStats);

export default router;

