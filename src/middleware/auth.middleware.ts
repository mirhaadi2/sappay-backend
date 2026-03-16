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

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return next(new AppError("UnauthorizedError", 401, "Authentication required."));
  }

  req.user = req.session.user;
  next();
};
