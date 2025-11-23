import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getUserAccount,
  getRecipientAccountDetails,
  createInternalTransfer, 
  createExternalTransfer,
  getFrequentInternalRecipients,
  getFrequentExternalRecipients,
  getTransactionDetails
} from '../controllers/transferController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user account (single account per user)
router.get('/account', getUserAccount);

// Get recipient account details (for confirmation)
router.get('/recipient/:account_number', getRecipientAccountDetails);

// Get frequent recipients
router.get('/frequent-internal', getFrequentInternalRecipients);
router.get('/frequent-external', getFrequentExternalRecipients);

// Get transaction details for receipt
router.get('/transaction/:transaction_id', getTransactionDetails);

// Create transfers
router.post('/internal', createInternalTransfer);
router.post('/external', createExternalTransfer);

export default router;

