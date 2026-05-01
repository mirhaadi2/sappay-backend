/**
 * Admin Sellers Service
 * Professional implementation using shared pagination utility
 */

import { Op } from 'sequelize';
import { Seller, SellerStatus, BusinessType } from '../../sellers/model';
import { AppError } from '../../../utils/AppError';
import { AdminSellerQuery, AdminSeller } from './types';
import { calculatePagination, buildPaginatedResponse } from '../../shared/pagination';
import logger from '../../../utils/logger';
import { hashPassword, generateRandomPassword } from '../../../utils/password';
import { sendEmail } from '../../../utils/sendEmail';
import { sequelize } from '../../../db/sequelize';

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

export const adminCreateSeller = async (data: {
  email: string;
  name: string;
  businessName: string;
  businessLicense: string;
  phone: string;
}) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    // Check if seller already exists
    const existingSeller = await Seller.findOne({
      where: {
        [Op.or]: [
          { ownerEmail: data.email },
          { businessRegistrationNo: data.businessLicense }
        ]
      },
      transaction
    });
    if (existingSeller) {
      throw new AppError('ValidationError', 400, 'Seller with this email or business license already exists');
    }

    // Generate random password
    const plainPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(plainPassword);

    // Create seller
    const seller = await Seller.create({
      businessName: data.businessName,
      businessRegistrationNo: data.businessLicense,
      businessType: BusinessType.SOLE_PROPRIETOR, // Default business type
      businessAddress: '', // Will be filled later
      businessPhone: data.phone,
      ownerName: data.name,
      ownerEmail: data.email,
      password: hashedPassword,
      bankAccountName: '', // Will be filled later
      bankAccountNumber: '', // Will be filled later
      bankIfscCode: '', // Will be filled later
      commissionRate: 5.0, // Default commission
      status: SellerStatus.PENDING,
      onboardingStep: 0,
      metadata: {},
    }, { transaction });

    await transaction.commit();

    // Send welcome email with password (after transaction commits)
    try {
      await sendEmail({
        to: data.email,
        subject: 'Welcome to Sappey Seller Program - Your Account Details',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #4b3832;">Welcome to Sappey Seller Program!</h2>
            <p>Your seller account has been created successfully. Here are your login details:</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Password:</strong> ${plainPassword}</p>
            </div>
            <p style="color: #d32f2f; font-weight: bold;">⚠️ Please change your password after first login for security.</p>
            <p>Your account is currently under review. You will receive an email once your account is approved and you can start selling.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `,
        fromMailType: 'support'
      });
    } catch (emailError) {
      logger.error('Failed to send welcome email to seller', { sellerId: seller.id, email: data.email, error: emailError });
      // Don't fail the seller creation if email fails
    }

    logger.info('Seller created by admin', { sellerId: seller.id, email: data.email });
    return adminGetSeller(seller.id);
  } catch (error: any) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        logger.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    logger.error('Error creating admin seller', { email: data.email, error });
    if (error instanceof AppError) throw error;
    throw new AppError('SellerError', 500, error.message || 'Failed to create seller');
  }
};

export const adminGetSeller = async (id: string): Promise<any> => {
  try {
    const seller = await Seller.findByPk(id, {
      attributes: { exclude: ['password'] },
      raw: true,
    });

    if (!seller) {
      throw new AppError('NotFoundError', 404, 'Seller not found');
    }

    // Return full seller details for admin view
    return {
      id: seller.id,
      businessName: seller.businessName,
      businessRegistrationNo: seller.businessRegistrationNo,
      businessType: seller.businessType,
      businessIdType: seller.businessIdType,
      gstNumber: seller.gstNumber,
      businessAddress: seller.businessAddress,
      businessPhone: seller.businessPhone,
      ownerName: seller.ownerName,
      ownerEmail: seller.ownerEmail,
      bankAccountName: seller.bankAccountName,
      bankAccountNumber: seller.bankAccountNumber,
      bankIfscCode: seller.bankIfscCode,
      commissionRate: seller.commissionRate,
      status: seller.status,
      approvedAt: seller.approvedAt,
      rejectedReason: seller.rejectedReason,
      onboardingStep: seller.onboardingStep,
      metadata: seller.metadata,
      createdAt: seller.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: seller.updatedAt?.toISOString() || new Date().toISOString(),
      // Additional computed fields for admin view
      verificationStatus: seller.status.toLowerCase(),
      email: seller.ownerEmail,
      name: seller.ownerName,
      phone: seller.businessPhone,
      products: 0, // TODO: Calculate from products table
      orders: 0, // TODO: Calculate from orders table
      revenue: 0, // TODO: Calculate from orders table
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
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const seller = await Seller.findByPk(id, { transaction });

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
      await seller.update(updateData, { transaction });
    }

    await transaction.commit();
    logger.info('Seller updated by admin', { sellerId: id, changes: updateData });
    return adminGetSeller(id);
  } catch (error: any) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        logger.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    logger.error('Error updating admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};

export const adminDeleteSeller = async (id: string) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const seller = await Seller.findByPk(id, { transaction });

    if (!seller) {
      throw new AppError('NotFoundError', 404, 'Seller not found');
    }

    await seller.destroy({ transaction });
    
    await transaction.commit();
    logger.info('Seller deleted by admin', { sellerId: id });
    return { success: true, message: 'Seller deleted successfully' };
  } catch (error: any) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        logger.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    logger.error('Error deleting admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};

export const adminApproveSeller = async (id: string) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const seller = await Seller.findByPk(id, { transaction });

    if (!seller) {
      throw new AppError('NotFoundError', 404, 'Seller not found');
    }

    await seller.update({
      status: SellerStatus.APPROVED,
      rejectedReason: null,
      approvedAt: new Date(),
    }, { transaction });

    await transaction.commit();
    logger.info('Seller approved by admin', { sellerId: id });
    return adminGetSeller(id);
  } catch (error: any) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        logger.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    logger.error('Error approving admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};

export const adminRejectSeller = async (id: string, reason?: string) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const seller = await Seller.findByPk(id, { transaction });

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
    }, { transaction });

    await transaction.commit();
    logger.info('Seller rejected by admin', { sellerId: id, reason });
    const sellerData = await adminGetSeller(id);
    return {
      ...sellerData,
      reason: reason || 'Rejected by admin',
    };
  } catch (error: any) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        logger.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    logger.error('Error rejecting admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};

export const adminSuspendSeller = async (id: string, reason?: string) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const seller = await Seller.findByPk(id, { transaction });

    if (!seller) {
      throw new AppError('NotFoundError', 404, 'Seller not found');
    }

    const metadata = seller.metadata || {};
    metadata.suspensionReason = reason || 'Suspended by admin';
    metadata.suspendedAt = new Date().toISOString();

    await seller.update({
      status: SellerStatus.SUSPENDED,
      metadata,
    }, { transaction });

    await transaction.commit();
    logger.info('Seller suspended by admin', { sellerId: id, reason });
    return adminGetSeller(id);
  } catch (error: any) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        logger.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    logger.error('Error suspending admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};

export const adminRestoreSeller = async (id: string) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const seller = await Seller.findByPk(id, { paranoid: false, transaction });

    if (!seller) {
      throw new AppError('NotFoundError', 404, 'Seller not found');
    }

    await seller.restore({ transaction });
    
    await transaction.commit();
    logger.info('Seller restored by admin', { sellerId: id });
    return adminGetSeller(id);
  } catch (error: any) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        logger.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    logger.error('Error restoring admin seller', { sellerId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Seller not found');
  }
};
