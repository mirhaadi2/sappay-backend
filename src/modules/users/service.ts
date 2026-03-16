import { UserPayload, UserRole } from "../../types/user";
import { createUser, findUserByEmail, findUserById } from "./repository";
import { hashPassword, comparePassword } from "../../utils/password";
import { signJwt } from "../../config/jwt";
import { AppError } from "../../utils/AppError";

export const registerUser = async (email: string, password: string) => {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError("ConflictError", 409, "Email already registered.");
  }

  const hashed = await hashPassword(password);
  const user = await createUser({ email, password: hashed, role: UserRole.USER });
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError("UnauthorizedError", 401, "Invalid credentials.");
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new AppError("UnauthorizedError", 401, "Invalid credentials.");
  }

  const payload: UserPayload = {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
  };

  return payload;
};

export const getUserById = async (id: string) => {
  const user = await findUserById(id);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
  };
};
