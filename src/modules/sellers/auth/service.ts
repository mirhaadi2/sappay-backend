/**
 * Seller Authentication Service
 * Handles seller login, registration, and profile management
 */

import { comparePassword, hashPassword } from '../../../utils/password';
import { AppError } from '../../../utils/AppError';
import { sendWelcomeEmail } from '../../../utils/sendEmail';
import { SellerStatus } from '../model';
import { create, findById, findByEmail } from '../repository';
import { SellerLoginCredentials, SellerRegisterCredentials } from './types';

export const registerSellerService = async (data: SellerRegisterCredentials) => {
  const {
    password,
    businessName,
    businessRegistrationNo,
    businessType,
    businessIdType,
    gstNumber,
    businessAddress,
    businessPhone,
    ownerName,
    ownerEmail,
    bankAccountName,
    bankAccountNumber,
    bankIfscCode,
  } = data;

  // Check if seller already exists
  const existingSeller = await findByEmail(ownerEmail);
  if (existingSeller) {
    throw new AppError('Conflict', 409, 'Seller with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create seller
  const seller = await create({
    ownerEmail,
    ownerName,
    businessName,
    businessRegistrationNo,
    businessType,
    businessIdType,
    gstNumber,
    businessAddress,
    businessPhone,
    bankAccountName,
    bankAccountNumber,
    bankIfscCode,
    password: hashedPassword,
    status: 'PENDING' as SellerStatus,
  });

  // Send welcome email (async, don't wait)
  sendWelcomeEmail(ownerEmail, ownerName).catch(err =>
    console.error('Failed to send welcome email:', err)
  );

  return seller;
};

export const loginSellerService = async (email: string, password: string) => {
  // Find seller by email
  const seller = await findByEmail(email);
  console.log(seller,'seeller')
  if (!seller) {
    throw new AppError('Unauthorized', 401, 'Invalid email or password');
  }

  // Check password
  if (!seller.password) {
    throw new AppError('Unauthorized', 401, 'Invalid email or password');
  }

  const isValidPassword = await comparePassword(password, seller.password);
  if (!isValidPassword) {
    throw new AppError('Unauthorized', 401, 'Invalid email or password');
  }

  // Check seller status
  if (seller.status === 'SUSPENDED') {
    throw new AppError('Forbidden', 403, 'Your seller account has been suspended');
  }

  if (seller.status === 'REJECTED') {
    throw new AppError('Forbidden', 403, 'Your seller application has been rejected');
  }

  if (seller.status === 'PENDING') {
    throw new AppError('Forbidden', 403, 'Your seller application is still under review');
  }

  return { seller };
};

export const getSellerProfileService = async (sellerId: string) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }

  return seller;
};