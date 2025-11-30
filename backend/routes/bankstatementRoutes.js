import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { getBankStatement, getTransactionsSummary } from '../controllers/bankstatementController.js';

const router = express.Router();

// Get bank statement data (customer info + transactions)
router.get('/statement', authenticateUser, getBankStatement);

// Get transactions summary
router.get('/statement/summary', authenticateUser, getTransactionsSummary);

export default router;
