import { UserPayload, UserRole } from "../../types/user";
import { createUser, findUserByEmail, findUserByPhone, findUserById } from "./repository";
import { hashPassword, comparePassword } from "../../utils/password";
import { signJwt } from "../../config/jwt";
import { AppError } from "../../utils/AppError";
import { sendOtpToEmail, verifyOtp } from "./otp.service";
import { OtpType } from "./otp.model";

export const checkUserExists = async (email: string, phone: string) => {
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    throw new AppError("ConflictError", 409, "Email already registered");
  }

  const existingPhone = await findUserByPhone(phone);
  if (existingPhone) {
    throw new AppError("ConflictError", 409, "Phone number already registered");
  }

  return { available: true };
};

export const initiateRegistration = async (name: string, email: string, phone: string) => {
  // Check if user already exists
  await checkUserExists(email, phone);

  // Send OTP to email
  const otpCode = await sendOtpToEmail(email, OtpType.REGISTRATION);

  return {
    message: "OTP sent successfully",
    // Don't return the code in production
    otpSent: true,
  };
};

export const verifyRegistrationOtp = async (email: string, otp: string) => {
  const isValid = await verifyOtp(email, otp, OtpType.REGISTRATION);

  if (isValid) {
    return {
      message: "OTP verified successfully",
      verified: true,
    };
  }

  throw new AppError("ValidationError", 400, "Invalid OTP");
};

export const completeRegistration = async (
  name: string,
  email: string,
  phone: string,
  password: string
) => {
  // Double-check user doesn't exist (in case of race conditions)
  await checkUserExists(email, phone);

  const hashed = await hashPassword(password);
  const user = await createUser({
    email,
    password: hashed,
    name,
    phone,
    role: UserRole.USER
  });

  const payload: UserPayload = {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
  };

  return {
    user: payload,
    message: "Registration completed successfully",
  };
};

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
