import { NextFunction, Request, Response } from "express";
import { UserRole } from "../types/user";
import { AppError } from "../utils/AppError";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      role: UserRole;
    };
  }
}

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
