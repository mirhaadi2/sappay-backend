import { Request, Response, NextFunction } from "express";
import {
  loginUser,
  registerUser,
  getUserById,
  checkUserExists,
  initiateRegistration,
  verifyRegistrationOtp,
  completeRegistration,
  sendOtpForLogin,
  verifyOtpForLogin,
  updateUserProfile
} from "./service";
import { config } from "../../../config";
import { AppError } from "../../../utils/AppError";

export const registerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await registerUser(email, password);
    
    req.session.user = user;
    
    res.status(201).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export const checkUserExistsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone } = req.body;
    const result = await checkUserExists(email, phone);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const initiateRegistrationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone } = req.body;
    const result = await initiateRegistration(name, email, phone);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyRegistrationOtpHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyRegistrationOtp(email, otp);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const completeRegistrationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, password } = req.body;
    const result = await completeRegistration(name, email, phone, password);

    // Set session after successful registration
    req.session.user = result.user;

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser(email, password);

    req.session.user = user;

    res.json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export const logoutHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie(config.session.cookieName);
      res.json({ message: "Logged out successfully" });
    });
  } catch (err) {
    next(err);
  }
};

export const meHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(200).json({
        success: true,
        data: { user: null },
      });
    }
    const user = await getUserById(userId);
    res.json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfileHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'Authentication required');
    }

    const { name, email, phone } = req.body;

    // Validate input
    if (!name && !email && !phone) {
      throw new AppError('ValidationError', 400, 'At least one field (name, email, or phone) must be provided');
    }

    const updatedUser = await updateUserProfile(userId, { name, email, phone });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: "Profile updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const sendOtpHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contact, contactType } = req.body;
    const result = await sendOtpForLogin(contact, contactType);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyOtpHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contact, otp, contactType } = req.body;
    const result = await verifyOtpForLogin(contact, otp, contactType);

    if (req.session) {
      req.session.user = result.user;
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
