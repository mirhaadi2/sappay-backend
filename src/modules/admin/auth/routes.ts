/**
 * Admin Portal Authentication Routes
 * Unified login for both admin and staff users
 */

import { Router } from 'express';
import { loginHandler, logoutHandler, meHandler } from './controller';
import { requireAdminPortalAuth } from './middleware';

const router = Router();

/**
 * POST /api/admin/auth/login
 * Unified admin portal login (handles both admin and staff)
 * Returns user object with user_type field ('admin' or 'staff')
 */
router.post('/login', loginHandler);

/**
 * POST /api/admin/auth/logout
 * Admin portal logout (works for both admin and staff)
 */
router.post('/logout', requireAdminPortalAuth, logoutHandler);

/**
 * GET /api/admin/auth/me
 * Get current admin portal user (admin or staff)
 */
router.get('/me', meHandler);

export default router;
