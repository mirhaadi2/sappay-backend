/**
 * Portal Middleware
 * Validates that the request token matches the portal context
 */

import { Request, Response, NextFunction } from 'express';
import { Portal, getPortalFromRole } from '../config/portal-config';

declare global {
  namespace Express {
    interface Request {
      portal?: Portal;
      userId?: string;
      userRole?: string;
    }
  }
}

/**
 * Middleware to detect and validate portal context from JWT
 */
export const portalMiddleware = (expectedPortal: Portal) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get portal from user role in JWT
      const userRole = (req as any).user?.role;
      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'No user role found in token',
        });
      }

      const tokenPortal = getPortalFromRole(userRole);

      // Validate portal match
      if (tokenPortal !== expectedPortal) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Token is for ${tokenPortal} portal, but ${expectedPortal} portal was requested.`,
        });
      }

      req.portal = expectedPortal;
      req.userId = (req as any).user?.id;
      req.userRole = userRole;

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Portal validation failed',
      });
    }
  };
};

/**
 * Middleware to auto-detect portal from user role
 */
export const detectPortalMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole) {
      req.portal = getPortalFromRole(userRole);
      req.userId = (req as any).user?.id;
      req.userRole = userRole;
    }
    next();
  } catch (error) {
    next();
  }
};
