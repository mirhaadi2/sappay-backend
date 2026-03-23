/**
 * Seller Authentication Routes
 * Public routes for seller registration and login
 */

import { Router } from 'express';
import { registerSellerHandler, loginSellerHandler, logoutSellerHandler } from './controller';

const router = Router();

// Public routes (no auth required)
router.post('/register', registerSellerHandler);
router.post('/login', loginSellerHandler);
router.post('/logout', logoutSellerHandler);

export default router;