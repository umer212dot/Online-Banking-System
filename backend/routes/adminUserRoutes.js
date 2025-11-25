import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { getAdminUserLists, updateUserStatus } from '../controllers/adminUserController.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/', getAdminUserLists);
router.patch('/:userId/status', updateUserStatus);

export default router;


