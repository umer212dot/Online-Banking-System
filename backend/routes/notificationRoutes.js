import express from 'express';
import { getLatestNotifications, getAllNotifications, markAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.get('/latest', protect, getLatestNotifications);
router.get('/all', protect, getAllNotifications);
router.put('/:notificationId/read', protect, markAsRead);

export default router;

