import { Router } from 'express';
import {
  getConfigHandler,
  sendOTPHandler,
  verifyOTPHandler,
} from './controller';

const router = Router();

/**
 * Public endpoints - no auth required
 */

// Get notification channel config (for determining contact field type)
router.get('/config', getConfigHandler);

// Send OTP to guest contact
router.post('/send-otp', sendOTPHandler);

// Verify OTP and get guest token
router.post('/verify-otp', verifyOTPHandler);

export default router;
