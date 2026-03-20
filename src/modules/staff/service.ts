/**
 * Staff Service
 * Business logic for staff operations
 */

import { Staff } from './models';
import { sequelize } from '../../db/sequelize';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { StaffCreateDTO, StaffUpdateDTO, StaffListFilters, StaffListResult } from './types';

/**
 * Get all staff with pagination and filters
 */
const listStaff = async (filters: StaffListFilters = {}): Promise<StaffListResult> => {
    const { status, department, limit = 20, offset = 0, search } = filters;

    const where: any = {
        deletedAt: null,
    };

    if (status) {
        where.status = status;
    }

    if (department) {
        where.department = department;
    }

    if (search) {
        where[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
        ];
    }

    const { count, rows } = await Staff.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        raw: true,
        attributes: {
            exclude: ['password'],
        },
    });

    return {
        staff: rows,
        total: count,
        limit,
        offset,
    };
};

/**
 * Get staff by ID
 */
const getStaffById = async (staffId: string): Promise<Staff> => {
    const staff = await Staff.findByPk(staffId, {
        attributes: {
            exclude: ['password'],
        },
    });

    if (!staff) {
        throw new Error(`Staff member not found with ID: ${staffId}`);
    }

    return staff;
};

/**
 * Get staff by email
 */
const getStaffByEmail = async (email: string): Promise<Staff | null> => {
    return Staff.findOne({
        where: { email },
        attributes: {
            exclude: ['password'],
        },
    });
};

/**
 * Create new staff member
 */
const createStaff = async (data: StaffCreateDTO): Promise<Staff> => {
    const transaction = await sequelize.transaction();

    try {
        const existingStaff = await Staff.findOne({
            where: { email: data.email },
        });

        if (existingStaff) {
            throw new Error(`Staff member with email '${data.email}' already exists`);
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const staff = await Staff.create(
            {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                department: data.department,
                manager_id: data.manager_id,
                hire_date: data.hire_date,
                status: 'active',
            },
            { transaction }
        );

        await transaction.commit();

        const result = staff.toJSON();
        delete (result as any).password;
        return result as Staff;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Update staff information
 */
const updateStaff = async (staffId: string, data: StaffUpdateDTO): Promise<Staff> => {
    const transaction = await sequelize.transaction();

    try {
        const staff = await Staff.findByPk(staffId, { transaction });

        if (!staff) {
            throw new Error(`Staff member not found with ID: ${staffId}`);
        }

        if (data.email && data.email !== staff.email) {
            const existingStaff = await Staff.findOne({
                where: { email: data.email },
            });

            if (existingStaff) {
                throw new Error(`Staff member with email '${data.email}' already exists`);
            }
        }

        if (data.email !== undefined) staff.email = data.email;
        if (data.name !== undefined) staff.name = data.name;
        if (data.phone !== undefined) staff.phone = data.phone;
        if (data.department !== undefined) staff.department = data.department;
        if (data.manager_id !== undefined) staff.manager_id = data.manager_id;
        if (data.hire_date !== undefined) staff.hire_date = data.hire_date;

        await staff.save({ transaction });
        await transaction.commit();

        const result = staff.toJSON();
        delete (result as any).password;
        return result as Staff;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Suspend staff member
 */
const suspendStaff = async (staffId: string): Promise<Staff> => {
    const transaction = await sequelize.transaction();

    try {
        const staff = await Staff.findByPk(staffId, { transaction });

        if (!staff) {
            throw new Error(`Staff member not found with ID: ${staffId}`);
        }

        if (staff.status === 'suspended') {
            throw new Error(`Staff member is already suspended`);
        }

        staff.status = 'suspended';
        await staff.save({ transaction });
        await transaction.commit();

        const result = staff.toJSON();
        delete (result as any).password;
        return result as Staff;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Activate staff member
 */
const activateStaff = async (staffId: string): Promise<Staff> => {
    const transaction = await sequelize.transaction();

    try {
        const staff = await Staff.findByPk(staffId, { transaction });

        if (!staff) {
            throw new Error(`Staff member not found with ID: ${staffId}`);
        }

        if (staff.status === 'active') {
            throw new Error(`Staff member is already active`);
        }

        staff.status = 'active';
        await staff.save({ transaction });
        await transaction.commit();

        const result = staff.toJSON();
        delete (result as any).password;
        return result as Staff;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Delete staff member (soft delete)
 */
const deleteStaff = async (staffId: string): Promise<void> => {
    const transaction = await sequelize.transaction();

    try {
        const staff = await Staff.findByPk(staffId, { transaction });

        if (!staff) {
            throw new Error(`Staff member not found with ID: ${staffId}`);
        }

        await staff.destroy({ transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Check if staff member is active
 */
const isStaffActive = async (staffId: string): Promise<boolean> => {
    const staff = await Staff.findByPk(staffId);
    return staff?.status === 'active' && !staff?.deletedAt;
};

/**
 * Verify staff credentials for login
 */
const verifyCredentials = async (email: string, password: string): Promise<Staff | null> => {
    const staff = await Staff.findOne({
        where: { email, status: 'active' },
    });

    if (!staff) {
        return null;
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);

    if (!isPasswordValid) {
        return null;
    }

    const result = staff.toJSON();
    delete (result as any).password;
    return result as Staff;
};

export {
    listStaff,
    getStaffById,
    getStaffByEmail,
    createStaff,
    updateStaff,
    suspendStaff,
    activateStaff,
    deleteStaff,
    isStaffActive,
    verifyCredentials,
};
