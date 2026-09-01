/**
 * Staff Service
 * Business logic for staff operations
 */

import { Staff } from './models';
import bcrypt from 'bcrypt';
import { StaffCreateDTO, StaffUpdateDTO, StaffListFilters, StaffListResult } from './types';
import { validateCreateStaff, validateUpdateStaff, validateUUID } from '../shared/validators';
import logger from '../../utils/logger';
import { withTransaction } from '../../utils/transaction';
import {
    activateStaffRecord,
    createStaffRecord,
    deleteStaffRecord,
    getStaffByCredentialsRecord,
    getStaffByEmailRecord,
    getStaffByIdRecord,
    listStaffRecord,
    suspendStaffRecord,
    updateStaffRecord,
} from './repository';

/**
 * Get all staff with pagination and filters
 */
const listStaff = async (filters: StaffListFilters = {}): Promise<StaffListResult> => {
    return listStaffRecord(filters);
};

/**
 * Get staff by ID
 */
const getStaffById = async (staffId: string): Promise<Staff> => {
    const staff = await getStaffByIdRecord(staffId);

    if (!staff) {
        throw new Error(`Staff member not found with ID: ${staffId}`);
    }

    return staff;
};

/**
 * Get staff by email
 */
const getStaffByEmail = async (email: string): Promise<Staff | null> => {
    return getStaffByEmailRecord(email);
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

    return withTransaction(async (transaction) => {
        // Normalize email to lowercase
        const normalizedEmail = data.email.toLowerCase().trim();

        const existingStaff = await getStaffByEmailRecord(normalizedEmail, transaction);

        if (existingStaff) {
            throw new Error('EMAIL_ALREADY_EXISTS');
        }

        // Validate manager exists if provided
        if (data.manager_id) {
            const manager = await getStaffByIdRecord(data.manager_id, transaction);
            if (!manager) throw new Error('INVALID_MANAGER_ID');
            // Prevent circular reference
            if (data.manager_id === data.manager_id) throw new Error('CIRCULAR_REFERENCE');
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);

        const staff = await createStaffRecord(
            {
                email: normalizedEmail,
                password: hashedPassword,
                name: data.name.trim(),
                phone: data.phone,
                department: data.department,
                manager_id: data.manager_id,
                hire_date: data.hire_date,
            },
            transaction,
        );

        logger.info('Staff member created', { staffId: staff.id, email: normalizedEmail });

        const result = staff.toJSON();
        delete (result as any).password;
        return result as Staff;
    });
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

    return withTransaction(async (transaction) => {
        const staff = await getStaffByIdRecord(staffId, transaction);

        if (!staff) {
            throw new Error('STAFF_NOT_FOUND');
        }

        if (data.email) {
            const normalizedEmail = data.email.toLowerCase().trim();
            if (normalizedEmail !== staff.email) {
                const existingStaff = await getStaffByEmailRecord(normalizedEmail, transaction);
                if (existingStaff) throw new Error('EMAIL_ALREADY_EXISTS');
            }
            staff.email = normalizedEmail;
        }

        // Validate manager if being updated
        if (data.manager_id && data.manager_id !== staff.manager_id) {
            const manager = await getStaffByIdRecord(data.manager_id, transaction);
            if (!manager) throw new Error('INVALID_MANAGER_ID');
            // Prevent self-assignment
            if (data.manager_id === staffId) throw new Error('CANNOT_BE_OWN_MANAGER');
        }

        const updatedStaff = await updateStaffRecord(staffId, data, transaction);
        if (!updatedStaff) {
            throw new Error('STAFF_NOT_FOUND');
        }

        logger.info('Staff updated', { staffId });

        const result = updatedStaff.toJSON();
        delete (result as any).password;
        return result as Staff;
    });
};

/**
 * Suspend staff member with audit logging
 */
const suspendStaff = async (staffId: string): Promise<Staff> => {
    const validation = validateUUID(staffId, 'staffId');
    if (!validation.valid) {
        throw new Error('INVALID_UUID');
    }

    return withTransaction(async (transaction) => {
        const staff = await getStaffByIdRecord(staffId, transaction);

        if (!staff) {
            throw new Error('STAFF_NOT_FOUND');
        }

        if (staff.status === 'suspended') {
            throw new Error('ALREADY_SUSPENDED');
        }

        const suspendedStaff = await suspendStaffRecord(staffId, transaction);
        if (!suspendedStaff) {
            throw new Error('STAFF_NOT_FOUND');
        }

        logger.warn('Staff suspended', { staffId, email: suspendedStaff.email });

        const result = suspendedStaff.toJSON();
        delete (result as any).password;
        return result as Staff;
    });
};

/**
 * Activate staff member with audit logging
 */
const activateStaff = async (staffId: string): Promise<Staff> => {
    const validation = validateUUID(staffId, 'staffId');
    if (!validation.valid) {
        throw new Error('INVALID_UUID');
    }

    return withTransaction(async (transaction) => {
        const staff = await getStaffByIdRecord(staffId, transaction);

        if (!staff) {
            throw new Error('STAFF_NOT_FOUND');
        }

        if (staff.status === 'active') {
            throw new Error('ALREADY_ACTIVE');
        }

        const activatedStaff = await activateStaffRecord(staffId, transaction);
        if (!activatedStaff) {
            throw new Error('STAFF_NOT_FOUND');
        }

        logger.info('Staff activated', { staffId, email: activatedStaff.email });

        const result = activatedStaff.toJSON();
        delete (result as any).password;
        return result as Staff;
    });
};

/**
 * Delete staff member (soft delete) with audit logging
 */
const deleteStaff = async (staffId: string): Promise<void> => {
    const validation = validateUUID(staffId, 'staffId');
    if (!validation.valid) {
        throw new Error('INVALID_UUID');
    }

    return withTransaction(async (transaction) => {
        const staff = await getStaffByIdRecord(staffId, transaction);

        if (!staff) {
            throw new Error('STAFF_NOT_FOUND');
        }

        const deleted = await deleteStaffRecord(staffId, transaction);
        if (!deleted) {
            throw new Error('STAFF_NOT_FOUND');
        }

        logger.warn('Staff deleted', { staffId, email: staff.email });
    });
};

/**
 * Check if staff member is active
 */
const isStaffActive = async (staffId: string): Promise<boolean> => {
    const staff = await getStaffByIdRecord(staffId);
    return staff?.status === 'active' && !staff?.deletedAt;
};

/**
 * Verify staff credentials for login
 */
const verifyCredentials = async (email: string, password: string): Promise<Staff | null> => {
    const staff = await getStaffByCredentialsRecord(email);

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
