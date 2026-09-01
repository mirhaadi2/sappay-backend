/**
 * Admin Customers Service
 * Professional implementation using shared pagination utility
 */

import { Op } from 'sequelize';
import { User, UserRole } from '../../admin/customers/models';
import { AppError } from '../../../utils/AppError';
import { AdminUserQuery, AdminUser } from './types';
import { calculatePagination, buildPaginatedResponse } from '../../shared/pagination';
import logger from '../../../utils/logger';
import { hashPassword, generateRandomPassword } from '../../../utils/password';
import { withTransaction } from '../../../utils/transaction';

export const adminListUsers = async (query: AdminUserQuery) => {
    try {
        const { page, limit, offset } = calculatePagination(
            { page: query.page, limit: query.limit },
            100,
        );

        const whereClause: any = {};

        if (query.search) {
            whereClause[Op.or] = [
                { email: { [Op.iLike]: `%${query.search}%` } },
                { name: { [Op.iLike]: `%${query.search}%` } },
            ];
        }

        const sortBy = query.sortBy === 'email' ? 'email' : 'createdAt';
        const sortOrder = (query.sortOrder || 'desc').toUpperCase();

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            offset,
            limit,
            order: [[sortBy, sortOrder]],
            attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
        });

        const users = rows.map((user: any) => ({
            id: user?.id || user?.dataValues?.id,
            email: user?.email || user?.dataValues?.email || '',
            name: user?.name || user?.dataValues?.name || '',
            phone: user?.phone || user?.dataValues?.phone || '',
            status: 'active' as const,
            createdAt:
                user?.createdAt?.toISOString() ||
                user?.dataValues?.createdAt ||
                new Date().toISOString(),
            updatedAt:
                user?.updatedAt?.toISOString() ||
                user?.dataValues?.updatedAt ||
                new Date().toISOString(),
        }));

        return buildPaginatedResponse(users, count, { page, limit, offset });
    } catch (error: any) {
        logger.error('Error listing admin customers', { error });
        throw new AppError('UserError', 500, error.message || 'Failed to list customers');
    }
};

export const adminCreateUser = async (data: { email: string; name?: string; phone?: string }) => {
    return withTransaction(async (transaction) => {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: data.email }, transaction });
        if (existingUser) {
            throw new AppError('ValidationError', 400, 'User with this email already exists');
        }

        // Generate random password
        const plainPassword = generateRandomPassword();
        const hashedPassword = await hashPassword(plainPassword);

        // Create user
        const user = await User.create(
            {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                role: 'USER' as UserRole,
            },
            { transaction },
        );

        logger.info('Customer created by admin', { customerId: user.id, email: data.email });
        return {
            ...(await adminGetUser(user.id)),
            password: plainPassword,
        };
    });
};

export const adminGetUser = async (id: string): Promise<AdminUser> => {
    try {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
        });

        if (!user) {
            throw new AppError('NotFoundError', 404, 'User not found');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name || '',
            phone: user.phone,
            status: 'active' as const,
            createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
        };
    } catch (error: any) {
        logger.error('Error fetching admin customer', { customerId: id, error });
        if (error instanceof AppError) throw error;
        throw new AppError('NotFoundError', 404, 'User not found');
    }
};

export const adminUpdateUser = async (id: string, data: { name?: string; phone?: string }) => {
    return withTransaction(async (transaction) => {
        const user = await User.findByPk(id, { transaction });

        if (!user) {
            throw new AppError('NotFoundError', 404, 'User not found');
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.phone !== undefined) updateData.phone = data.phone;

        if (Object.keys(updateData).length > 0) {
            await user.update(updateData, { transaction });
        }

        logger.info('Customer updated by admin', { customerId: id, changes: updateData });
        return adminGetUser(id);
    });
};

export const adminDeleteUser = async (id: string) => {
    return withTransaction(async (transaction) => {
        const user = await User.findByPk(id, { transaction });

        if (!user) {
            throw new AppError('NotFoundError', 404, 'User not found');
        }

        await user.destroy({ transaction });
        logger.info('Customer deleted by admin', { customerId: id });
        return { success: true, message: 'User deleted successfully' };
    });
};

export const adminBanUser = async (id: string) => {
    try {
        const user = await User.findByPk(id);

        if (!user) {
            throw new AppError('NotFoundError', 404, 'User not found');
        }

        // Note: Ban functionality would require adding a status field to customer model
        logger.info('Customer ban action attempted by admin', { customerId: id });
        return adminGetUser(id);
    } catch (error: any) {
        logger.error('Error processing ban action for admin customer', { customerId: id, error });
        if (error instanceof AppError) throw error;
        throw new AppError('NotFoundError', 404, 'User not found');
    }
};

export const adminUnbanUser = async (id: string) => {
    try {
        const user = await User.findByPk(id);

        if (!user) {
            throw new AppError('NotFoundError', 404, 'User not found');
        }

        // Note: Unban functionality would require adding a status field to customer model
        logger.info('Customer unban action attempted by admin', { customerId: id });
        return adminGetUser(id);
    } catch (error: any) {
        logger.error('Error processing unban action for admin customer', { customerId: id, error });
        if (error instanceof AppError) throw error;
        throw new AppError('NotFoundError', 404, 'User not found');
    }
};
