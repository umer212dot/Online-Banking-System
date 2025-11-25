import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { 
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendSystemNotification,
  getAllUsers
} from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes
router.get('/', getUserNotifications);
router.patch('/:notification_id/read', markNotificationAsRead);
router.patch('/read-all', markAllNotificationsAsRead);

// Admin routes
router.get('/users', adminOnly, getAllUsers);
router.post('/send', adminOnly, sendSystemNotification);

export default router;

