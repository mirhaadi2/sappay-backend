import { NextFunction, Request, Response } from "express";
import { UserRole } from "../types/user";
import { AppError } from "../utils/AppError";
import { verifyJwt } from "../config/jwt";
import { portalConfigs, Portal } from "../config/portal-config";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      role: UserRole;
    };
    sellerId?: string;
    userType?: string;
    sellerStatus?: string;
    admin?: any;
    staff?: any;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Validates JWT token from portal-specific cookie
 */
export const requireJwtAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Determine portal from URL path
    let portal: Portal = Portal.WEBSITE;
    const path = req.path;

    if (path.includes('/api/admin') || path.includes('/admin')) {
      portal = Portal.ADMIN;
    } else if (path.includes('/api/sellers') || path.includes('/sellers') || path.includes('/seller')) {
      portal = Portal.SELLER;
    }

    const cookieName = portalConfigs[portal].cookieName;
    const token = req.cookies?.[cookieName] || req.signedCookies?.[cookieName];

    if (!token) {
      return next(new AppError("UnauthorizedError", 401, "Authentication required. Please login."));
    }

    // Remove 's:' prefix if present (session signature)
    const cleanToken = token.startsWith('s:') ? token.slice(2) : token;

    // Verify JWT
    const payload = verifyJwt(cleanToken);

    // Set user on request
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
    };

    next();
  } catch (error) {
    return next(new AppError("UnauthorizedError", 401, "Invalid or expired token."));
  }
};

/**
 * Session-Based Authentication Middleware
 * Validates user session from HttpOnly secure cookie
 * Sessions are stored in Redis for scalability
 * Browser automatically sends cookie on each request
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check if session has user data
  if (!req.session?.user) {
    return next(new AppError("UnauthorizedError", 401, "Authentication required. Please login."));
  }

  // User is authenticated via session
  req.user = req.session.user;
  next();
};
