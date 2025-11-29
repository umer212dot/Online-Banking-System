import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { getManagedAccounts, updateAccountStatus } from '../controllers/adminUserController.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/', getManagedAccounts);
router.patch('/:accountId/status', updateAccountStatus);

export default router;

