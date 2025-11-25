import express from 'express';
import { registerUser, loginUser, logoutUser, registerAdmin, getCurrentUser, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);  // register user
router.post('/login', loginUser);        // login user

// ADMIN registration (Postman / backend only)
router.post('/registerAdmin', registerAdmin);

// Protected route example
router.post('/logout', protect, logoutUser);  // logout user

// Get current authenticated user
router.get('/me', protect, getCurrentUser);

// Update user profile
router.put('/update-profile', protect, updateProfile);

export default router;

