import { Seller, SellerStatus, BusinessType } from './model';
import { AppError } from '../../utils/AppError';
import { sequelize } from '../../db/sequelize';
import logger from '../../utils/logger';

export const create = async (sellerData: {
  // userId: string;
  password?: string;
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
  status?: SellerStatus;
}) => {
  const transaction = await sequelize.transaction();
  try {
    const seller = await Seller.create(
      {
        ...sellerData,
        businessType: sellerData.businessType as unknown as BusinessType,
      },
      { transaction }
    );
    await transaction.commit();
    logger.info('Seller created', { sellerId: seller.id, businessName: sellerData.businessName });
    return seller;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating seller', { businessName: sellerData.businessName, error });
    throw error;
  }
};

export const findById = async (sellerId: string, includeDeleted = false) => {
  return await Seller.findByPk(sellerId, { paranoid: !includeDeleted });
};

// export const findByUserId = async (userId: string) => {
//   return await Seller.findOne({ where: { userId }, paranoid: true });
// };

export const findByBusinessReg = async (regNo: string) => {
  return await Seller.findOne({
    where: { businessRegistrationNo: regNo },
    paranoid: true,
  });
};

export const findByEmail = async (email: string) => {
  return await Seller.findOne({
    where: { ownerEmail: email },
    paranoid: true,
    raw: true,
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
  const transaction = await sequelize.transaction();
  try {
    const seller = await Seller.findByPk(sellerId, { transaction });
    if (!seller) {
      throw new AppError('NotFound', 404, 'Seller not found');
    }
    const updated = await seller.update(data, { transaction });
    await transaction.commit();
    logger.info('Seller updated', { sellerId });
    return updated;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating seller', { sellerId, error });
    throw error;
  }
};

export const updateStatus = async (
  sellerId: string,
  status: string,
  approvalData?: any
) => {
  const transaction = await sequelize.transaction();
  try {
    const seller = await Seller.findByPk(sellerId, { transaction });
    if (!seller) {
      throw new AppError('NotFound', 404, 'Seller not found');
    }

    if (status === 'APPROVED') {
      const updated = await seller.update({
        status: SellerStatus.APPROVED,
        approvedAt: new Date(),
        rejectedReason: undefined,
      }, { transaction });
      await transaction.commit();
      logger.info('Seller approved', { sellerId });
      return updated;
    } else if (status === 'REJECTED') {
      const updated = await seller.update({
        status: SellerStatus.REJECTED,
        rejectedReason: approvalData?.reason || 'Not specified',
      }, { transaction });
      await transaction.commit();
      logger.info('Seller rejected', { sellerId });
      return updated;
    } else if (status === 'SUSPENDED') {
      const updated = await seller.update({
        status: SellerStatus.SUSPENDED,
        metadata: {
          ...seller.metadata,
          suspensionReason: approvalData?.reason,
          suspendedAt: new Date(),
        },
      }, { transaction });
      await transaction.commit();
      logger.info('Seller suspended', { sellerId });
      return updated;
    }

    const updated = await seller.update({ status: status as unknown as SellerStatus }, { transaction });
    await transaction.commit();
    logger.info('Seller status updated', { sellerId, status });
    return updated;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating seller status', { sellerId, status, error });
    throw error;
  }
};

export const updateOnboardingStep = async (sellerId: string, step: number) => {
  const transaction = await sequelize.transaction();
  try {
    const seller = await Seller.findByPk(sellerId, { transaction });
    if (!seller) {
      throw new AppError('NotFound', 404, 'Seller not found');
    }
    const updated = await seller.update({ onboardingStep: step }, { transaction });
    await transaction.commit();
    logger.info('Seller onboarding step updated', { sellerId, step });
    return updated;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating seller onboarding step', { sellerId, step, error });
    throw error;
  }
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
  const transaction = await sequelize.transaction();
  try {
    const seller = await Seller.findByPk(sellerId, { transaction });
    if (!seller) {
      throw new AppError('NotFound', 404, 'Seller not found');
    }
    await seller.destroy({ transaction });
    await transaction.commit();
    logger.info('Seller deleted', { sellerId });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting seller', { sellerId, error });
    throw error;
  }
};
