/**
 * Staff Authentication Service
 * Handles staff login/logout logic with RBAC support
 */

import { Staff } from '../models';
import bcrypt from 'bcrypt';
import { logger } from '../../../utils/logger';
import { AppError } from '../../../utils/AppError';
import { StaffPayload } from '../types';
import { findStaffByEmailRecord, findStaffByIdRecord } from './repository';

/**
 * Find staff by email
 */
export const findStaffByEmail = async (email: string): Promise<Staff | null> => {
    try {
        return await findStaffByEmailRecord(email);
    } catch (error) {
        logger.error('Error finding staff by email', { email, error });
        throw new AppError('InternalError', 500, 'Database error');
    }
};

/**
 * Find staff by ID
 */
export const findStaffById = async (id: string): Promise<Staff | null> => {
    try {
        return await findStaffByIdRecord(id);
    } catch (error) {
        logger.error('Error finding staff by ID', { staffId: id, error });
        throw new AppError('InternalError', 500, 'Database error');
    }
};

/**
 * Login staff with email and password
 */
export const loginStaff = async (email: string, password: string): Promise<StaffPayload> => {
    if (!email || !password) {
        throw new AppError('ValidationError', 400, 'Email and password are required');
    }

    try {
        const staff = await findStaffByEmail(email);

        if (!staff) {
            logger.warn('Staff login attempt with non-existent email', { email });
            throw new AppError('UnauthorizedError', 401, 'Invalid email or password');
        }

        // Check if staff is active
        if (staff.status !== 'active') {
            logger.warn('Login attempt for inactive staff', {
                staffId: staff.id,
                status: staff.status,
            });
            throw new AppError(
                'UnauthorizedError',
                401,
                `Account is ${staff.status}. Please contact admin.`,
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, staff.password);
        if (!isPasswordValid) {
            logger.warn('Staff login attempt with invalid password', { email });
            throw new AppError('UnauthorizedError', 401, 'Invalid email or password');
        }

        logger.info('Staff login successful', {
            staffId: staff.id,
            email,
            department: staff.department,
        });

        // Return staff payload (exclude password)
        const payload: StaffPayload = {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            status: staff.status,
            department: staff.department,
        };

        return payload;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        logger.error('Error during staff login', { email, error });
        throw new AppError('InternalError', 500, 'Authentication failed');
    }
};

/**
 * Get staff details (for /me endpoint)
 */
export const getStaffDetails = async (staffId: string): Promise<StaffPayload | null> => {
    try {
        const staff = await findStaffById(staffId);
        if (!staff) {
            return null;
        }

        return {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            status: staff.status,
            department: staff.department,
        };
    } catch (error) {
        logger.error('Error getting staff details', { staffId, error });
        throw new AppError('InternalError', 500, 'Failed to fetch staff details');
    }
};
