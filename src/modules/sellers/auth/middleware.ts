/**
 * Seller Authentication Middleware
 * Handles authentication for seller users
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../utils/logger';
import { AppError } from '../../../utils/AppError';

/**
 * Middleware to require seller authentication
 */
export const authenticateSeller = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get seller ID from session (set during login)
    const sellerId = (req.session as any)?.sellerId;
    const userType = (req.session as any)?.userType;
    
    // Debug logging
    logger.debug('Authenticating seller', {
      sellerId,
      userType,
      hasSession: !!req.session,
      sessionData: req.session ? Object.keys(req.session) : [],
    });

    if (!sellerId || userType !== 'SELLER') {
      logger.warn('Unauthorized seller access attempt', {
        sellerId,
        userType,
        ip: req.ip,
        path: req.path,
      });
      throw new AppError('UnauthorizedError', 401, 'Seller authentication required');
    }

    // Attach to request for use in controllers
    (req as any).sellerId = sellerId;
    (req as any).userType = userType;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if seller is active
 */
export const requireActiveSeller = (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = (req.session as any).sellerId;
    const userType = (req.session as any).userType;
    const sellerStatus = (req.session as any).sellerStatus;

    if (!sellerId || userType !== 'SELLER') {
      throw new AppError('UnauthorizedError', 401, 'Seller authentication required');
    }

    if (sellerStatus !== 'ACTIVE') {
      throw new AppError('ForbiddenError', 403, 'Seller account is not active');
    }

    next();
  } catch (error) {
    next(error);
  }
};