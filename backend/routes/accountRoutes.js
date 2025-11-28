import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAccountDetails, getFinancialData } from '../controllers/accountController.js';

const router = express.Router();

router.use(protect);

router.get('/details', getAccountDetails);
router.get('/financial-data', getFinancialData);

export default router;

