/**
 * Admin Portal Authentication Controller
 * Handles unified login for both admin and staff users
 */

import { Request, Response, NextFunction } from 'express';
import { loginAdminPortal, loginAdmin, getAdminDetails } from './service';
import { getStaffDetails } from '../../staff/auth/service';
import { logger } from '../../../utils/logger';

/**
 * POST /api/admin/auth/login
 * Unified admin portal login (handles both admin and staff)
 */
export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const response = await loginAdminPortal(email, password);
    const user = response.user;

    // Set session with user_type to differentiate admin/staff
    // Follow same pattern as website/seller logins
    if (user.user_type === 'admin') {
      (req.session as any).admin = user;
      (req.session as any).user_type = 'admin';
    } else {
      (req.session as any).staff = user;
      (req.session as any).user_type = 'staff';
    }

    console.log('[loginHandler] Before save - Session ID:', req.sessionID);
    console.log('[loginHandler] Setting user in session:', user.user_type);

    // Explicitly save session to ensure it's persisted to Redis
    req.session.save((err) => {
      if (err) {
        logger.error('Failed to save session', { error: err });
        console.log('[loginHandler] Session save ERROR:', err);
        return res.status(500).json({ success: false, error: 'Session save failed' });
      }

      console.log('[loginHandler] Session saved successfully');
      logger.info('Admin portal login successful', { userId: user.id, userType: user.user_type });

      res.json({
        success: true,
        data: { user },
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/auth/logout
 * Admin portal logout (works for both admin and staff)
 */
export const logoutHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.session as any).admin?.id || (req.session as any).staff?.id;
    const userType = (req.session as any).user_type;

    req.session.destroy((err) => {
      if (err) {
        logger.error('Error destroying session', { userId, userType, error: err });
        return next(err);
      }

      logger.info('Admin portal user logged out', { userId, userType });
      res.clearCookie('admin-session');
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/auth/me
 * Get current admin portal user details (admin or staff)
 */
export const meHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req.session as any).admin?.id;
    const staffId = (req.session as any).staff?.id;
    const userType = (req.session as any).user_type;

    if (!adminId && !staffId) {
      return res.json({
        success: true,
        data: { user: null },
      });
    }

    let user: any;
    if (userType === 'admin' && adminId) {
      const adminData = await getAdminDetails(adminId);
      user = { ...adminData, user_type: 'admin' };
    } else if (userType === 'staff' && staffId) {
      const staffData = await getStaffDetails(staffId);
      user = { ...staffData, user_type: 'staff' };
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
