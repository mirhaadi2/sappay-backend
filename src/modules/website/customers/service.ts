import { randomBytes } from "crypto";
import { UserPayload } from "../../../types/user";
import { createUser, findUserByEmail, findUserByPhone, findUserById, findUserByWhatsapp, updateUser } from "./repository";
import { hashPassword, comparePassword } from "../../../utils/password";
import { signJwt } from "../../../config/jwt";
import { AppError } from "../../../utils/AppError";
import { sendOtp, verifyOtp } from "./otp.service";
import { OtpType } from "../../admin/customers/otp.model";
import { getOrCreateCustomer } from "../guests/customer.service";
import { sequelize } from "../../../db/sequelize";

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
  const otpCode = await sendOtp(email, 'email', OtpType.REGISTRATION);

  return {
    message: "OTP sent successfully",
    // Don't return the code in production
    otpSent: true,
  };
};

export const verifyRegistrationOtp = async (email: string, otp: string) => {
  const isValid = await verifyOtp(email, 'email', otp, OtpType.REGISTRATION);

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
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    // Double-check user doesn't exist (in case of race conditions)
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      throw new AppError("ConflictError", 409, "Email already registered");
    }

    const existingPhone = await findUserByPhone(phone);
    if (existingPhone) {
      throw new AppError("ConflictError", 409, "Phone number already registered");
    }

    const hashed = await hashPassword(password);
    const user = await createUser({
      email,
      password: hashed,
      name,
      phone,
      role: 'D2C_CUSTOMER'
    }, transaction);

    await transaction.commit();

    const payload: UserPayload = {
      id: user.id,
      email: user.email!,
      role: user.role as any,
    };

    return {
      user: payload,
      message: "Registration completed successfully",
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        console.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    throw error;
  }
};

export const registerUser = async (email: string, password: string) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const existing = await findUserByEmail(email);
    if (existing) {
      throw new AppError("ConflictError", 409, "Email already registered.");
    }

    const hashed = await hashPassword(password);
    const user = await createUser({ email, password: hashed, role: 'D2C_CUSTOMER' }, transaction);
    
    await transaction.commit();
    
    return {
      id: user.id,
      email: user.email!,
      role: user.role as any,
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        console.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError("UnauthorizedError", 401, "Invalid credentials.");
  }

  if (!user.password) {
    throw new AppError("UnauthorizedError", 401, "Invalid credentials.");
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new AppError("UnauthorizedError", 401, "Invalid credentials.");
  }

  const payload: UserPayload = {
    id: user.id,
    email: user.email!,
    role: user.role as any,
  };

  return payload;
};

export const getUserById = async (id: string) => {
  const user = await findUserById(id);
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email || '',
    phone: user.phone,
    role: user.role,
  };
};

export const updateUserProfile = async (userId: string, data: {
  name?: string;
  email?: string;
  phone?: string;
}) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    // Validate that the user exists
    const existingUser = await findUserById(userId);
    if (!existingUser) {
      throw new AppError('NotFoundError', 404, 'User not found');
    }

    // Check if email is being updated and if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const userWithEmail = await findUserByEmail(data.email);
      if (userWithEmail && userWithEmail.id !== userId) {
        throw new AppError('ValidationError', 400, 'Email already in use');
      }
    }

    // Check if phone is being updated and if it's already taken
    if (data.phone && data.phone !== existingUser.phone) {
      const userWithPhone = await findUserByPhone(data.phone);
      if (userWithPhone && userWithPhone.id !== userId) {
        throw new AppError('ValidationError', 400, 'Phone number already in use');
      }
    }

    const updatedUser = await updateUser(userId, data, transaction);
    if (!updatedUser) {
      throw new AppError('InternalServerError', 500, 'Failed to update profile');
    }

    await transaction.commit();

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email || '',
      phone: updatedUser.phone,
      role: updatedUser.role,
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        console.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    throw error;
  }
};

export const sendOtpForLogin = async (contact: string, contactType: 'email' | 'phone' | 'whatsapp') => {
  await sendOtp(contact, contactType, OtpType.LOGIN);

  return {
    message: `OTP sent to your ${contactType}`,
    otpSent: true,
  };
};

export const verifyOtpForLogin = async (contact: string, otp: string, contactType: 'email' | 'phone' | 'whatsapp') => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const isValid = await verifyOtp(contact, contactType, otp, OtpType.LOGIN);

    if (!isValid) {
      throw new AppError('ValidationError', 400, 'Invalid OTP');
    }

    // Get or create customer
    let email, phone, whatsapp;
    if (contactType === 'email') {
      email = contact;
    } else if (contactType === 'phone') {
      phone = contact;
    } else if (contactType === 'whatsapp') {
      whatsapp = contact;
    }

    const customerId = await getOrCreateCustomer(email, phone, whatsapp);

    // For authentication, we need a user record. Create if not exists
    let user = null;
    if (contactType === 'email') {
      user = await findUserByEmail(contact);
    } else if (contactType === 'phone') {
      user = await findUserByPhone(contact);
    } else if (contactType === 'whatsapp') {
      user = await findUserByWhatsapp(contact);
    }

    if (!user) {
      const randomPassword = randomBytes(16).toString('hex');
      const hashedPassword = await hashPassword(randomPassword);
      user = await createUser({
        email,
        phone,
        whatsapp,
        password: hashedPassword,
        role: 'D2C_CUSTOMER'
      }, transaction);
    }

    await transaction.commit();

    const token = signJwt({
      sub: user.id,
      email: user.email || '',
      role: user.role as any,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: (user.email || '') as string,
        phone: user.phone,
        role: user.role as any,
      },
      token,
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        console.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    throw error;
  }
};
