/**
 * Staff Authentication Controller
 * Handles staff login/logout HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { loginStaff, getStaffDetails } from './service';
import { logger } from '../../../utils/logger';

/**
 * POST /api/staff/auth/login
 * Staff login
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

    const staff = await loginStaff(email, password);

    // Set session
    (req.session as any).staff = staff;

    logger.info('Staff session created', { staffId: staff.id, email: staff.email });

    res.json({
      success: true,
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/staff/auth/logout
 * Staff logout
 */
export const logoutHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staffId = (req.session as any).staff?.id;

    req.session.destroy((err) => {
      if (err) {
        logger.error('Error destroying session', { staffId, error: err });
        return next(err);
      }

      logger.info('Staff logged out', { staffId });
      res.clearCookie('staff-session');
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
 * GET /api/staff/auth/me
 * Get current logged-in staff details
 */
export const meHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staffId = (req as any).staff?.id;

    const staff = await getStaffDetails(staffId);

    res.json({
      success: true,
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
};
