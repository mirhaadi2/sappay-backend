/**
 * Admin Portal Authentication Middleware
 * Handles authentication for both admin and staff users in admin portal
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../utils/logger';
import { AppError } from '../../../utils/AppError';

/**
 * Middleware to require admin portal authentication (admin or staff)
 */
export const requireAdminPortalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = (req.session as any).admin;
    const staff = (req.session as any).staff;
    const userType = (req.session as any).user_type;

    if (!admin && !staff) {
      logger.warn('Unauthorized admin portal access attempt');
      throw new AppError('UnauthorizedError', 401, 'Authentication required');
    }

    // Attach to request for use in controllers
    if (userType === 'admin') {
      (req as any).admin = admin;
      (req as any).userType = 'admin';
    } else {
      (req as any).staff = staff;
      (req as any).userType = 'staff';
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is active (admin or staff)
 */
export const requireActiveAdminPortalUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = (req.session as any).admin;
    const staff = (req.session as any).staff;
    const userType = (req.session as any).user_type;

    if (!admin && !staff) {
      throw new AppError('UnauthorizedError', 401, 'Authentication required');
    }

    const user = userType === 'admin' ? admin : staff;
    if (user.status !== 'active') {
      logger.warn('Inactive user access attempt', { userId: user.id, status: user.status, userType });
      throw new AppError('ForbiddenError', 403, 'Your account is not active');
    }

    // Attach to request
    if (userType === 'admin') {
      (req as any).admin = admin;
      (req as any).userType = 'admin';
    } else {
      (req as any).staff = staff;
      (req as any).userType = 'staff';
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy middleware - kept for backward compatibility
 */
export const requireAdminAuth = requireAdminPortalAuth;
