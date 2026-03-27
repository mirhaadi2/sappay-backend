import { AppError } from '../../utils/AppError';
import { comparePassword, hashPassword } from '../../utils/password';
import { signJwt } from '../../config/jwt';
import {
  findById,
  findByEmail,
  // findByUserId,
  findByBusinessReg,
  create,
  update,
  updateStatus,
  findAll,
  getSellerStats,
} from './repository';
import { sendSellerApprovalEmail, sendSellerRejectionEmail } from '../../utils/sendEmail';

export const registerSeller = async (
  sellerData: {
    password: string; // This should be already hashed by controller
    businessName: string;
    businessRegistrationNo: string;
    businessType: string;
    businessIdType?: string;
    gstNumber?: string;
    businessAddress: string;
    businessPhone: string;
    ownerName: string;
    ownerEmail: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankIfscCode: string;
  }
) => {
  // Check if business is already registered
  const existingBusiness = await findByBusinessReg(sellerData.businessRegistrationNo);
  if (existingBusiness) {
    throw new AppError('BadRequest', 400, 'This business registration number is already registered');
  }

  // Validate required business information
  if (!sellerData.businessName || !sellerData.businessAddress) {
    throw new AppError('BadRequest', 400, 'Missing required seller information');
  }

  // Store businessIdType in metadata for easy access and future features
  const metadata = sellerData.businessIdType ? { businessIdType: sellerData.businessIdType } : {};

  // Create seller record with hashed password
  const seller = await create({
    businessName: sellerData.businessName,
    businessRegistrationNo: sellerData.businessRegistrationNo,
    businessType: sellerData.businessType,
    businessIdType: sellerData.businessIdType,
    // gstNumber: sellerData.gstNumber,
    businessAddress: sellerData.businessAddress,
    businessPhone: sellerData.businessPhone,
    ownerName: sellerData.ownerName,
    ownerEmail: sellerData.ownerEmail,
    password: sellerData.password, // Already hashed by controller
    bankAccountName: sellerData.bankAccountName,
    bankAccountNumber: sellerData.bankAccountNumber,
    bankIfscCode: sellerData.bankIfscCode,
    // metadata,
  });

  // Return registration success response
  return {
    id: seller.id,
    status: seller.status,
    onboardingStep: seller.onboardingStep,
    message: 'Seller account created successfully. Check your email for further instructions.',
  };
};

export const getSellerProfile = async (sellerId: string) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }

  return {
    id: seller.id,
    businessName: seller.businessName,
    businessType: seller.businessType,
    gstNumber: seller.gstNumber,
    status: seller.status,
    commissionRate: seller.commissionRate,
    onboardingStep: seller.onboardingStep,
    approvedAt: seller.approvedAt,
    createdAt: seller.createdAt,
  };
};

export const updateProfile = async (
  sellerId: string,
  userId: string,
  updates: any
) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }

  // if (seller.userId !== userId) {
  //   throw new AppError('Forbidden', 403, 'Unauthorized: Cannot update another seller profile');
  // }

  const allowedFields = [
    'businessAddress',
    'businessPhone',
    'bankAccountName',
    'bankAccountNumber',
    'bankIfscCode',
    'ownerName',
    'ownerEmail',
  ];

  const updateData: any = {};
  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      updateData[key] = updates[key];
    }
  });

  return await update(sellerId, updateData);
};

export const getDashboardStats = async (sellerId: string) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }

  const stats = await getSellerStats(sellerId);

  return {
    seller: {
      id: seller.id,
      businessName: seller.businessName,
      commissionRate: seller.commissionRate,
    },
    stats,
    onboardingStatus: {
      step: seller.onboardingStep,
      completed: seller.onboardingStep === 100,
    },
  };
};

export const approveSeller = async (sellerId: string, approvalData?: any) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }

  if (seller.status !== 'PENDING') {
    throw new AppError('BadRequest', 400, `Cannot approve seller with status: ${seller.status}`);
  }

  const updated = await updateStatus(sellerId, 'APPROVED');
  return {
    id: updated.id,
    status: updated.status,
    message: 'Seller has been approved',
  };
};

export const rejectSeller = async (sellerId: string, reason: string) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }

  if (seller.status !== 'PENDING') {
    throw new AppError('BadRequest', 400, `Cannot reject seller with status: ${seller.status}`);
  }

  const updated = await updateStatus(sellerId, 'REJECTED', { reason });

  return {
    id: updated.id,
    status: updated.status,
    message: 'Seller registration has been rejected',
  };
};

export const suspendSeller = async (sellerId: string, reason: string) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }

  if (seller.status === 'SUSPENDED') {
    throw new AppError('BadRequest', 400, 'Seller is already suspended');
  }

  const updated = await updateStatus(sellerId, 'SUSPENDED', { reason });

  return {
    id: updated.id,
    status: updated.status,
    message: 'Seller account has been suspended',
  };
};

export const listSellersByFilter = async (filters: any) => {
  return await findAll(filters);
};

export const listSellers = listSellersByFilter;

export const validateSellerStatus = async (sellerId: string) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }

  if (seller.status !== 'APPROVED') {
    throw new AppError(
      'Forbidden',
      403,
      `Seller cannot operate with status: ${seller.status}`
    );
  }

  return true;
};

/**
 * Seller Login Service
 * Authenticates seller by email and password
 * Returns JWT tokens with portal-scoped authentication
 */
export const loginSeller = async (email: string, password: string) => {
  // Find seller by email
  const seller = await findByEmail(email);
  if (!seller || !seller.password) {
    throw new AppError('Unauthorized', 401, 'Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, seller.password);
  if (!isPasswordValid) {
    throw new AppError('Unauthorized', 401, 'Invalid email or password');
  }

  // Check seller status
  if (seller.status === 'REJECTED') {
    throw new AppError('Forbidden', 403, 'Your seller account has been rejected');
  }

  if (seller.status === 'SUSPENDED') {
    throw new AppError('Forbidden', 403, 'Your seller account has been suspended');
  }

  // Generate JWT tokens with seller/portal context
  const accessToken = signJwt({
    sub: seller.id,
    email: seller.ownerEmail,
    role: 'SELLER' as any,
  });

  const refreshToken = signJwt({
    sub: seller.id,
    email: seller.ownerEmail,
    role: 'SELLER' as any,
  });

  return {
    seller: {
      id: seller.id,
      businessName: seller.businessName,
      ownerName: seller.ownerName,
      ownerEmail: seller.ownerEmail,
      status: seller.status,
      businessType: seller.businessType,
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: 86400, // 24 hours
    },
  };
};

/**
 * Get Current Seller Profile
 * Returns complete seller profile for authenticated seller
 */
export const getCurrentSellerProfile = async (sellerId: string) => {
  console.log(sellerId, 'sellerId')
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller profile not found');
  }

  return {
    id: seller.id,
    businessName: seller.businessName,
    businessType: seller.businessType,
    businessIdType: seller.metadata?.businessIdType,
    gstNumber: seller.gstNumber,
    businessAddress: seller.businessAddress,
    businessPhone: seller.businessPhone,
    ownerName: seller.ownerName,
    ownerEmail: seller.ownerEmail,
    bankAccountName: seller.bankAccountName,
    bankAccountNumber: seller.bankAccountNumber,
    bankIfscCode: seller.bankIfscCode,
    status: seller.status,
    commissionRate: seller.commissionRate,
    onboardingStep: seller.onboardingStep,
    approvedAt: seller.approvedAt,
    createdAt: seller.createdAt,
  };
};

/**
 * Change Seller Password
 * Updates seller password after validating current password
 */
export const changeSellerPassword = async (
  sellerId: string,
  currentPassword: string,
  newPassword: string
) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }

  // Verify current password
  const isValidPassword = await comparePassword(currentPassword, seller?.password ?? '');
  if (!isValidPassword) {
    throw new AppError('Unauthorized', 401, 'Current password is incorrect');
  }

  // Hash and update new password
  const hashedPassword = await hashPassword(newPassword);
  const updated = await update(sellerId, { password: hashedPassword });

  return {
    id: updated.id,
    message: 'Password changed successfully',
  };
};

/**
 * Get Seller Notification Preferences
 * Returns seller's notification preference settings
 */
export const getSellerNotificationPreferences = async (sellerId: string) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }

  const preferences = seller.metadata?.notificationPreferences || {
    emailOrders: true,
    emailProducts: true,
    emailPromotions: false,
    smsAlerts: false,
  };

  return preferences;
};

/**
 * Update Seller Notification Preferences
 * Updates seller's notification preference settings
 */
export const updateSellerNotificationPreferences = async (
  sellerId: string,
  preferences: {
    emailOrders?: boolean;
    emailProducts?: boolean;
    emailPromotions?: boolean;
    smsAlerts?: boolean;
  }
) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }

  const currentMetadata = seller.metadata || {};
  const updatedMetadata = {
    ...currentMetadata,
    notificationPreferences: {
      emailOrders: preferences.emailOrders ?? true,
      emailProducts: preferences.emailProducts ?? true,
      emailPromotions: preferences.emailPromotions ?? false,
      smsAlerts: preferences.smsAlerts ?? false,
    },
  };

  const updated = await update(sellerId, { metadata: updatedMetadata });

  return updatedMetadata.notificationPreferences;
};
