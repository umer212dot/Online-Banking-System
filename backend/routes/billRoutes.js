import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { 
  getBillers,
  getAllBillers,
  getBillAmount,
  createBillPayment,
  getBillPaymentHistory,
  addBiller,
  updateBillerStatus,
  deleteBiller
} from '../controllers/billController.js';

const router = express.Router();

// Public route - get active billers (for dropdown)
router.get('/billers', getBillers);

// Admin route - get all billers including deactivated
router.get('/billers/all', protect, adminOnly, getAllBillers);

// Protected routes - require authentication
router.use(protect);

// Customer routes
router.post('/bill-amount', getBillAmount);
router.post('/pay', createBillPayment);
router.get('/history', getBillPaymentHistory);

// Admin routes - require admin role
router.post('/biller', adminOnly, addBiller);
router.patch('/biller/:biller_id/status', adminOnly, updateBillerStatus);
router.delete('/biller/:biller_id', adminOnly, deleteBiller);

export default router;

