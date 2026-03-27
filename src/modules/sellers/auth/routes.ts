/**
 * Seller Authentication Routes
 * Public routes for seller registration and login
 */

import { Router } from 'express';
import { registerSellerHandler, loginSellerHandler, logoutSellerHandler, initiateRegistrationHandler, verifyOtpHandler } from './controller';

const router = Router();

// Public routes (no auth required)
// New OTP-based registration flow
router.post('/initiate-registration', initiateRegistrationHandler);
router.post('/verify-otp', verifyOtpHandler);

// Legacy registration (keep for backward compatibility)
router.post('/register', registerSellerHandler);
router.post('/login', loginSellerHandler);
router.post('/logout', logoutSellerHandler);

export default router;