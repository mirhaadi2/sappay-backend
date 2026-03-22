/**
 * Staff Authentication Middleware
 * Handles authentication checks for staff endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../utils/logger';
import { AppError } from '../../../utils/AppError';

/**
 * Middleware to require staff authentication
 */
export const requireStaffAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = (req.session as any).staff;

    if (!staff || !staff.id) {
      logger.warn('Unauthorized staff access attempt');
      throw new AppError('UnauthorizedError', 401, 'Staff authentication required');
    }

    // Attach staff to request for use in controllers
    (req as any).staff = staff;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require staff authentication with active status check
 */
export const requireActiveStaff = (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = (req.session as any).staff;

    if (!staff || !staff.id) {
      throw new AppError('UnauthorizedError', 401, 'Staff authentication required');
    }

    if (staff.status !== 'active') {
      logger.warn('Inactive staff access attempt', { staffId: staff.id, status: staff.status });
      throw new AppError('ForbiddenError', 403, 'Your account is not active');
    }

    (req as any).staff = staff;
    next();
  } catch (error) {
    next(error);
  }
};
