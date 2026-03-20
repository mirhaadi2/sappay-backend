/**
 * Staff Service
 * Business logic for staff operations
 */

import { Staff } from './models';
import { sequelize } from '../../db/sequelize';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { StaffCreateDTO, StaffUpdateDTO, StaffListFilters, StaffListResult } from './types';
import { AuditLog } from '../admin/models';
import { validateCreateStaff, validateUpdateStaff, validateUUID } from '../shared/validators';
import logger from '../../utils/logger';

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
 * Create new staff member with comprehensive validation
 */
const createStaff = async (data: StaffCreateDTO): Promise<Staff> => {
    // Validate input
    const validation = validateCreateStaff(data);
    if (!validation.valid) {
        logger.warn('Staff creation validation failed', { errors: validation.errors });
        throw new Error('VALIDATION_ERROR');
    }

    const transaction = await sequelize.transaction();

    try {
        // Normalize email to lowercase
        const normalizedEmail = data.email.toLowerCase().trim();
        
        const existingStaff = await Staff.findOne({
            where: { email: normalizedEmail },
        });

        if (existingStaff) {
            throw new Error('EMAIL_ALREADY_EXISTS');
        }

        // Validate manager exists if provided
        if (data.manager_id) {
            const manager = await Staff.findByPk(data.manager_id);
            if (!manager) throw new Error('INVALID_MANAGER_ID');
            // Prevent circular reference
            if (data.manager_id === data.manager_id) throw new Error('CIRCULAR_REFERENCE');
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);

        const staff = await Staff.create(
            {
                email: normalizedEmail,
                password: hashedPassword,
                name: data.name.trim(),
                phone: data.phone?.trim(),
                department: data.department?.trim(),
                manager_id: data.manager_id,
                hire_date: data.hire_date,
                status: 'active',
            },
            { transaction }
        );

        await transaction.commit();
        logger.info('Staff member created', { staffId: staff.id, email: normalizedEmail });

        const result = staff.toJSON();
        delete (result as any).password;
        return result as Staff;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating staff', { email: data.email, error });
        throw error;
    }
};

/**
 * Update staff information with validation
 */
const updateStaff = async (staffId: string, data: StaffUpdateDTO): Promise<Staff> => {
    // Validate UUID
    const uuidValidation = validateUUID(staffId, 'staffId');
    if (!uuidValidation.valid) {
        throw new Error('INVALID_UUID');
    }
    
    // Validate update data
    const validation = validateUpdateStaff(data);
    if (!validation.valid) {
        logger.warn('Staff update validation failed', { staffId, errors: validation.errors });
        throw new Error('VALIDATION_ERROR');
    }
    
    const transaction = await sequelize.transaction();

    try {
        const staff = await Staff.findByPk(staffId, { transaction });

        if (!staff) {
            throw new Error('STAFF_NOT_FOUND');
        }

        if (data.email) {
            const normalizedEmail = data.email.toLowerCase().trim();
            if (normalizedEmail !== staff.email) {
                const existingStaff = await Staff.findOne({
                    where: { email: normalizedEmail },
                });
                if (existingStaff) throw new Error('EMAIL_ALREADY_EXISTS');
            }
            staff.email = normalizedEmail;
        }
        
        // Validate manager if being updated
        if (data.manager_id && data.manager_id !== staff.manager_id) {
            const manager = await Staff.findByPk(data.manager_id);
            if (!manager) throw new Error('INVALID_MANAGER_ID');
            // Prevent self-assignment
            if (data.manager_id === staffId) throw new Error('CANNOT_BE_OWN_MANAGER');
        }

        if (data.name !== undefined) staff.name = data.name.trim();
        if (data.phone !== undefined) staff.phone = data.phone?.trim();
        if (data.department !== undefined) staff.department = data.department?.trim();
        if (data.manager_id !== undefined) staff.manager_id = data.manager_id;
        if (data.hire_date !== undefined) staff.hire_date = data.hire_date;

        await staff.save({ transaction });
        await transaction.commit();
        
        logger.info('Staff updated', { staffId });

        const result = staff.toJSON();
        delete (result as any).password;
        return result as Staff;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating staff', { staffId, error });
        throw error;
    }
};

/**
 * Suspend staff member with audit logging
 */
const suspendStaff = async (staffId: string): Promise<Staff> => {
    const validation = validateUUID(staffId, 'staffId');
    if (!validation.valid) {
        throw new Error('INVALID_UUID');
    }
    
    const transaction = await sequelize.transaction();

    try {
        const staff = await Staff.findByPk(staffId, { transaction });

        if (!staff) {
            throw new Error('STAFF_NOT_FOUND');
        }

        if (staff.status === 'suspended') {
            throw new Error('ALREADY_SUSPENDED');
        }

        staff.status = 'suspended';
        await staff.save({ transaction });
        await transaction.commit();
        
        logger.warn('Staff suspended', { staffId, email: staff.email });

        const result = staff.toJSON();
        delete (result as any).password;
        return result as Staff;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error suspending staff', { staffId, error });
        throw error;
    }
};

/**
 * Activate staff member with audit logging
 */
const activateStaff = async (staffId: string): Promise<Staff> => {
    const validation = validateUUID(staffId, 'staffId');
    if (!validation.valid) {
        throw new Error('INVALID_UUID');
    }
    
    const transaction = await sequelize.transaction();

    try {
        const staff = await Staff.findByPk(staffId, { transaction });

        if (!staff) {
            throw new Error('STAFF_NOT_FOUND');
        }

        if (staff.status === 'active') {
            throw new Error('ALREADY_ACTIVE');
        }

        staff.status = 'active';
        await staff.save({ transaction });
        await transaction.commit();
        
        logger.info('Staff activated', { staffId, email: staff.email });

        const result = staff.toJSON();
        delete (result as any).password;
        return result as Staff;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error activating staff', { staffId, error });
        throw error;
    }
};

/**
 * Delete staff member (soft delete) with audit logging
 */
const deleteStaff = async (staffId: string): Promise<void> => {
    const validation = validateUUID(staffId, 'staffId');
    if (!validation.valid) {
        throw new Error('INVALID_UUID');
    }
    
    const transaction = await sequelize.transaction();

    try {
        const staff = await Staff.findByPk(staffId, { transaction });

        if (!staff) {
            throw new Error('STAFF_NOT_FOUND');
        }

        await staff.destroy({ transaction });
        await transaction.commit();
        
        logger.warn('Staff deleted', { staffId, email: staff.email });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting staff', { staffId, error });
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
