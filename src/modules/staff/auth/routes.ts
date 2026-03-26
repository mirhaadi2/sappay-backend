/**
 * Staff Authentication Routes
 */

import { Router } from 'express';
import { loginHandler, logoutHandler, meHandler } from './controller';
import { requireStaffAuth } from './middleware';

const router = Router();

/**
 * POST /api/staff/auth/login
 * Staff login endpoint
 */
router.post('/login', loginHandler);

/**
 * POST /api/staff/auth/logout
 * Staff logout (requires authentication)
 */
router.post('/logout', requireStaffAuth, logoutHandler);

/**
 * GET /api/staff/auth/me
 * Get current staff details
 */
router.get('/me', requireStaffAuth, meHandler);

export default router;
