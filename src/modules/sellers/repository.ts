import { Seller, SellerStatus, BusinessType } from './model';
import { AppError } from '../../utils/AppError';

export const create = async (sellerData: {
  userId: string;
  businessName: string;
  businessRegistrationNo: string;
  businessType: string;
  businessAddress: string;
  businessPhone: string;
  ownerName: string;
  ownerEmail: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
}) => {
  return await Seller.create({
    ...sellerData,
    businessType: sellerData.businessType as unknown as BusinessType,
  });
};

export const findById = async (sellerId: string, includeDeleted = false) => {
  return await Seller.findByPk(sellerId, { paranoid: !includeDeleted });
};

export const findByUserId = async (userId: string) => {
  return await Seller.findOne({ where: { userId }, paranoid: true });
};

export const findByBusinessReg = async (regNo: string) => {
  return await Seller.findOne({
    where: { businessRegistrationNo: regNo },
    paranoid: true,
  });
};

export const findAll = async (filters: {
  status?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
} = {}) => {
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  const where: any = {};
  if (filters.status) where.status = filters.status;

  const order: any = [];
  if (filters.sortBy === 'recent') {
    order.push(['createdAt', 'DESC']);
  }

  return await Seller.findAndCountAll({
    where,
    limit,
    offset,
    order: order.length > 0 ? order : undefined,
    paranoid: true,
  });
};

export const update = async (sellerId: string, data: Partial<any>) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }
  return await seller.update(data);
};

export const updateStatus = async (
  sellerId: string,
  status: string,
  approvalData?: any
) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }

  if (status === 'APPROVED') {
    return await seller.update({
      status: SellerStatus.APPROVED,
      approvedAt: new Date(),
      rejectedReason: undefined,
    });
  } else if (status === 'REJECTED') {
    return await seller.update({
      status: SellerStatus.REJECTED,
      rejectedReason: approvalData?.reason || 'Not specified',
    });
  } else if (status === 'SUSPENDED') {
    return await seller.update({
      status: SellerStatus.SUSPENDED,
      metadata: {
        ...seller.metadata,
        suspensionReason: approvalData?.reason,
        suspendedAt: new Date(),
      },
    });
  }

  return await seller.update({ status: status as unknown as SellerStatus });
};

export const updateOnboardingStep = async (sellerId: string, step: number) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }
  return await seller.update({ onboardingStep: step });
};

export const getSellerStats = async (sellerId: string) => {
  return {
    totalOrders: 0,
    totalRevenue: 0,
    totalItems: 0,
    averageOrderValue: 0,
    refreshedAt: new Date(),
  };
};

export const deleteSeller = async (sellerId: string) => {
  const seller = await findById(sellerId);
  if (!seller) {
    throw new AppError('NotFound', 404, 'Seller not found');
  }
  return await seller.destroy();
};
