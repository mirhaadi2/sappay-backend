/**
 * Admin Sellers Service
 * Professional implementation using shared pagination utility
 */

import { Op } from 'sequelize';
import { Seller, SellerStatus } from '../../sellers/model';
import { AppError } from '../../../utils/AppError';
import { AdminSellerQuery, AdminSeller } from './types';
import { calculatePagination, buildPaginatedResponse } from '../../shared/pagination';
import logger from '../../../utils/logger';

export const adminListSellers = async (query: AdminSellerQuery) => {
  try {
    const { page, limit, offset } = calculatePagination(
      { page: query.page, limit: query.limit },
      100
    );

    const whereClause: any = {};

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.verificationStatus) {
      whereClause.verificationStatus = query.verificationStatus;
    }

    if (query.search) {
      whereClause[Op.or] = [
        { ownerEmail: { [Op.iLike]: `%${query.search}%` } },
        { businessName: { [Op.iLike]: `%${query.search}%` } },
        { ownerName: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    const sortBy = query.sortBy === 'businessName' ? 'businessName' : 'createdAt';
    const sortOrder = (query.sortOrder || 'desc').toUpperCase();

    const { count, rows } = await Seller.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      order: [[sortBy, sortOrder]],
      attributes: { exclude: ['password'] },
    });

    const sellers = rows.map((seller: any) => ({
      id: seller.id,
      email: seller.ownerEmail,
      name: seller.ownerName,
      businessName: seller.businessName,
      businessLicense: seller.businessRegistrationNo,
      verificationStatus: (seller.status || 'PENDING').toLowerCase(),
      status: (seller.status || 'PENDING').toLowerCase(),
      phone: seller.businessPhone,
      createdAt: seller.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: seller.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return buildPaginatedResponse(sellers, count, { page, limit, offset });
  } catch (error: any) {
    logger.error('Error listing admin sellers', { error });
    throw new AppError('SellerError', 500, error.message || 'Failed to list sellers');
  }
};

export const adminGetSeller = async (id: string): Promise<AdminSeller> => {
  try {
    const seller = await Seller.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!seller) {
      throw new AppError('NotFoundError', 404, 'Seller not found');
    }

    // Map seller status to verification status (lowercase for type compatibility)
    const verificationStatusMap: { [key: string]: 'pending' | 'approved' | 'rejected' } = {
      'PENDING': 'pending',
      'APPROVED': 'approved',
      'REJECTED': 'rejected',
    };

    return {
      id: seller.id,
      email: seller.ownerEmail,
      name: seller.ownerName,
      businessName: seller.businessName,
      businessLicense: seller.businessRegistrationNo,
      verificationStatus: verificationStatusMap[seller.status] || 'pending',
      status: 'active' as const,
      phone: seller.businessPhone,
      createdAt: seller.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: seller.updatedAt?.toISOString() || new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error fetching admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};

export const adminUpdateSeller = async (
  id: string,
  data: { name?: string; phone?: string; status?: 'active' | 'suspended' }
) => {
  try {
    const seller = await Seller.findByPk(id);

    if (!seller) {
      throw new AppError('NotFoundError', 404, 'Seller not found');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.ownerName = data.name;
    if (data.phone !== undefined) updateData.businessPhone = data.phone;
    if (data.status !== undefined) {
      updateData.status = data.status === 'suspended' ? 'SUSPENDED' : 'APPROVED';
    }

    if (Object.keys(updateData).length > 0) {
      await seller.update(updateData);
    }

    logger.info('Seller updated by admin', { sellerId: id, changes: updateData });
    return adminGetSeller(id);
  } catch (error: any) {
    logger.error('Error updating admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};

export const adminDeleteSeller = async (id: string) => {
  try {
    const seller = await Seller.findByPk(id);

    if (!seller) {
      throw new AppError('NotFoundError', 404, 'Seller not found');
    }

    await seller.destroy();
    logger.info('Seller deleted by admin', { sellerId: id });
    return { success: true, message: 'Seller deleted successfully' };
  } catch (error: any) {
    logger.error('Error deleting admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};

export const adminApproveSeller = async (id: string) => {
  try {
    const seller = await Seller.findByPk(id);

    if (!seller) {
      throw new AppError('NotFoundError', 404, 'Seller not found');
    }

    await seller.update({
      status: SellerStatus.APPROVED,
      approvedAt: new Date(),
    });

    logger.info('Seller approved by admin', { sellerId: id });
    return adminGetSeller(id);
  } catch (error: any) {
    logger.error('Error approving admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};

export const adminRejectSeller = async (id: string, reason?: string) => {
  try {
    const seller = await Seller.findByPk(id);

    if (!seller) {
      throw new AppError('NotFoundError', 404, 'Seller not found');
    }

    const metadata = seller.metadata || {};
    metadata.rejectionReason = reason || 'Rejected by admin';
    metadata.rejectedAt = new Date().toISOString();

    await seller.update({
      status: SellerStatus.REJECTED,
      rejectedReason: reason,
      metadata,
    });

    logger.info('Seller rejected by admin', { sellerId: id, reason });
    return adminGetSeller(id);
  } catch (error: any) {
    logger.error('Error rejecting admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};

export const adminSuspendSeller = async (id: string, reason?: string) => {
  try {
    const seller = await Seller.findByPk(id);

    if (!seller) {
      throw new AppError('NotFoundError', 404, 'Seller not found');
    }

    const metadata = seller.metadata || {};
    metadata.suspensionReason = reason || 'Suspended by admin';
    metadata.suspendedAt = new Date().toISOString();

    await seller.update({
      status: SellerStatus.SUSPENDED,
      metadata,
    });

    logger.info('Seller suspended by admin', { sellerId: id, reason });
    return adminGetSeller(id);
  } catch (error: any) {
    logger.error('Error suspending admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};

export const adminRestoreSeller = async (id: string) => {
  try {
    const seller = await Seller.findByPk(id, { paranoid: false });

    if (!seller) {
      throw new AppError('NotFoundError', 404, 'Seller not found');
    }

    await seller.restore();
    logger.info('Seller restored by admin', { sellerId: id });
    return adminGetSeller(id);
  } catch (error: any) {
    logger.error('Error restoring admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};
