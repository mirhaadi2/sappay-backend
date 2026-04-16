import { NextFunction, Request, Response } from "express";
import { UserRole } from "../types/user";
import { AppError } from "../utils/AppError";
import { verifyJwt } from "../config/jwt";
import { portalConfigs, Portal } from "../config/portal-config";
import jwt from "jsonwebtoken";
import { config } from "../config";

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
      guestCheckout?: {
        contact: string;
        contactType: 'email' | 'phone' | 'whatsapp';
        isGuest: true;
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
      id: payload.sub!,
      email: payload.email!,
      role: payload.role! as UserRole,
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

/**
 * Optional Auth Middleware (for Guest Checkout)
 * Allows EITHER:
 * 1. Authenticated users via session
 * 2. Guest users with valid guestToken in Authorization header
 *
 * Format: Authorization: Bearer <guestToken>
 * where guestToken is a JWT signed with guest claims
 */
export const allowAuthOrGuest = (req: Request, res: Response, next: NextFunction) => {
  // First try session-based auth
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }

  // Try guest token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret || 'change_me') as any;

      // Check if this is a guest token
      if (decoded.isGuest && decoded.contact && decoded.contactType) {
        req.guestCheckout = {
          contact: decoded.contact,
          contactType: decoded.contactType,
          isGuest: true as const,
        };
        return next();
      }
    } catch (error) {
      // Token verification failed, fall through to error
    }
  }

  // Neither session auth nor guest token found
  return next(new AppError("UnauthorizedError", 401, "Authentication required. Please login or complete OTP verification."));
};
