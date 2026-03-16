import { Request, Response, NextFunction } from "express";
import { loginUser, registerUser, getUserById } from "./service";
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
