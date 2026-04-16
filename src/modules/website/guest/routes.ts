import { Router } from 'express';
import {
  findCustomerHandler,
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

// Lookup existing guest customer by email/phone/whatsapp and return saved addresses
router.get('/lookup', findCustomerHandler);

export default router;
