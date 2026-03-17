import { Request, Response, NextFunction } from "express";
import {
  loginUser,
  registerUser,
  getUserById,
  checkUserExists,
  initiateRegistration,
  verifyRegistrationOtp,
  completeRegistration
} from "./service";
import { config } from "../../config";

export const registerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await registerUser(email, password);
    res.status(201).json({ user });
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

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser(email, password);

    req.session.user = user;

    res.json({ user });
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
      return res.status(200).json({ user: null });
    }
    const user = await getUserById(userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
