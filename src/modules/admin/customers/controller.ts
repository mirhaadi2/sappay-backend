import { Response, NextFunction } from "express";
import {
  adminListUsers,
  adminGetUser,
  adminUpdateUser,
  adminDeleteUser,
  adminBanUser,
  adminUnbanUser,
  adminCreateUser,
} from "./service";
import { AuthenticatedRequest } from "../middleware";
import logger from "../../../utils/logger";
import { sendEmail } from "../../../utils/sendEmail";

export const listUsersHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const result = await adminListUsers({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      status: (status as "active" | "banned") || undefined,
      sortBy: (sortBy as "createdAt" | "email") || "createdAt",
      sortOrder: (sortOrder as "asc" | "desc") || "desc",
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error("List users error", { error });
    next(error);
  }
};

export const createUserHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, name, phone } = req.body;
    const user = await adminCreateUser({ email, name, phone });
    
    // 1. Destructure to separate password from the rest of the data
    const { password: rawPassword, ...userWithoutPassword } = user;
    
    const password = rawPassword || "N/A";

    // 2. Return the filtered object
    res.status(201).json({ success: true, data: userWithoutPassword });

    await sendEmail({
      to: email,
      subject: "Welcome to Sappey - Your Account Details",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #4b3832;">Welcome to Sappey!</h2>
          <p>Your account has been created successfully. Here are your login details:</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          <p style="color: #d32f2f; font-weight: bold;">⚠️ Please change your password after first login for security.</p>
          <p>You can now log in to your account and start shopping.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `,
      fromMailType: 'support'
    });
    
  } catch (error: any) {
    logger.error("Create user error", { error });
    next(error);
  }
};

export const getUserHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const user = await adminGetUser(id);
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error("Get user error", { error });
    next(error);
  }
};

export const updateUserHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;
    const user = await adminUpdateUser(id, { name, phone });
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error("Update user error", { error });
    next(error);
  }
};

export const deleteUserHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    await adminDeleteUser(id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    logger.error("Delete user error", { error });
    next(error);
  }
};

export const banUserHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const user = await adminBanUser(id);
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error("Ban user error", { error });
    next(error);
  }
};

export const unbanUserHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const user = await adminUnbanUser(id);
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error("Unban user error", { error });
    next(error);
  }
};
