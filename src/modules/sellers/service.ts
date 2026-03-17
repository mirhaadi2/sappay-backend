import { AppError } from '../../utils/AppError';
import {
  findById,
  findByUserId,
  findByBusinessReg,
  create,
  update,
  updateStatus,
  findAll,
  getSellerStats,
} from './repository';

export const registerSeller = async (
  userId: string,
  sellerData: {
    businessName: string;
    businessRegistrationNo: string;
    businessType: string;
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
  const existingSeller = await findByUserId(userId);
  if (existingSeller) {
    throw new AppError('BadRequest', 400, 'You are already registered as a seller');
  }

  const existingBusiness = await findByBusinessReg(sellerData.businessRegistrationNo);
  if (existingBusiness) {
    throw new AppError('BadRequest', 400, 'This business registration number is already registered');
  }

  if (!sellerData.businessName || !sellerData.businessAddress) {
    throw new AppError('BadRequest', 400, 'Missing required seller information');
  }

  const seller = await create({ userId, ...sellerData });

  return {
    id: seller.id,
    status: seller.status,
    onboardingStep: seller.onboardingStep,
    message: 'Seller account created. Awaiting document verification.',
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

  if (seller.userId !== userId) {
    throw new AppError('Forbidden', 403, 'Unauthorized: Cannot update another seller profile');
  }

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
