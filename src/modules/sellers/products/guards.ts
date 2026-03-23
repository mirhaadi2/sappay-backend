/**
 * Seller Guards
 * Authorization middleware for seller operations
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../utils/AppError';

/**
 * Check if the authenticated user is a seller
 */
export const requireSeller = (req: Request, res: Response, next: NextFunction) => {
  const userType = (req.session as any)?.userType;
  const sellerId = (req.session as any)?.sellerId;

  if (!sellerId || userType !== 'SELLER') {
    throw new AppError('Forbidden', 403, 'Seller access required');
  }

  next();
};

/**
 * Check if the seller owns the resource
 */
export const requireSellerOwnership = (resourceSellerId: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const sellerId = (req.session as any)?.sellerId;

    if (!sellerId) {
      throw new AppError('Unauthorized', 401, 'Authentication required');
    }

    if (sellerId !== resourceSellerId) {
      throw new AppError('Forbidden', 403, 'Access denied: resource does not belong to seller');
    }

    next();
  };
};