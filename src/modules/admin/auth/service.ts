/**
 * Admin Authentication Service
 * Handles admin login/logout logic
 */

import { Admin } from '../admin.model';
import { Staff } from '../../staff/models';
import bcrypt from 'bcrypt';
import { logger } from '../../../utils/logger';
import { AppError } from '../../../utils/AppError';
import { AdminPayload, StaffPayload, UserPayload } from './types';

export { AdminPayload, StaffPayload, UserPayload };

/**
 * Find admin by email
 */
export const findAdminByEmail = async (email: string): Promise<Admin | null> => {
  try {
    return await Admin.findOne({
      where: { email: email.toLowerCase().trim() },
      raw: true,
    });
  } catch (error) {
    logger.error('Error finding admin by email', { email, error });
    throw new AppError('InternalError', 500, 'Database error');
  }
};

/**
 * Find admin by ID
 */
export const findAdminById = async (id: string): Promise<Admin | null> => {
  try {
    return await Admin.findByPk(id);
  } catch (error) {
    logger.error('Error finding admin by ID', { adminId: id, error });
    throw new AppError('InternalError', 500, 'Database error');
  }
};

/**
 * Unified login for admin portal (handles both admin and staff users)
 */
export const loginAdminPortal = async (email: string, password: string): Promise<{ user: UserPayload }> => {
  if (!email || !password) {
    throw new AppError('ValidationError', 400, 'Email and password are required');
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    // Try admin first
    const admin = await findAdminByEmail(normalizedEmail);
    
    if (admin) {
      // Check if admin is active
      if (admin.status !== 'active') {
        logger.warn('Login attempt for inactive admin', { adminId: admin.id, status: admin.status });
        throw new AppError('UnauthorizedError', 401, `Account is ${admin.status}. Please contact support.`);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        logger.warn('Admin login attempt with invalid password', { email });
        throw new AppError('UnauthorizedError', 401, 'Invalid email or password');
      }

      logger.info('Admin login successful', { adminId: admin.id, email });

      const payload: UserPayload = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        status: admin.status,
        user_type: 'admin',
      };

      return { user: payload };
    }

    // Try staff second
    const staff = await findStaffByEmail(normalizedEmail);
    
    if (staff) {
      // Check if staff is active
      if (staff.status !== 'active') {
        logger.warn('Login attempt for inactive staff', { staffId: staff.id, status: staff.status });
        throw new AppError('UnauthorizedError', 401, `Account is ${staff.status}. Please contact admin.`);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, staff.password);
      if (!isPasswordValid) {
        logger.warn('Staff login attempt with invalid password', { email });
        throw new AppError('UnauthorizedError', 401, 'Invalid email or password');
      }

      logger.info('Staff login successful via admin portal', { staffId: staff.id, email, department: staff.department });

      const payload: UserPayload = {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        status: staff.status,
        department: staff.department,
        user_type: 'staff',
      };

      return { user: payload };
    }

    // User not found in either table
    logger.warn('Login attempt with non-existent email', { email });
    throw new AppError('UnauthorizedError', 401, 'Invalid email or password');

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Error during admin portal login', { email, error });
    throw new AppError('InternalError', 500, 'Authentication failed');
  }
};

/**
 * Find staff by email (helper for unified login)
 */
const findStaffByEmail = async (email: string): Promise<Staff | null> => {
  try {
    return await Staff.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  } catch (error) {
    logger.error('Error finding staff by email', { email, error });
    return null;
  }
};

/**
 * Login admin with email and password
 */
export const loginAdmin = async (email: string, password: string): Promise<AdminPayload> => {
  if (!email || !password) {
    throw new AppError('ValidationError', 400, 'Email and password are required');
  }

  try {
    const admin = await findAdminByEmail(email);
    
    if (!admin) {
      logger.warn('Admin login attempt with non-existent email', { email });
      throw new AppError('UnauthorizedError', 401, 'Invalid email or password');
    }

    // Check if admin is active
    if (admin.status !== 'active') {
      logger.warn('Login attempt for inactive admin', { adminId: admin.id, status: admin.status });
      throw new AppError('UnauthorizedError', 401, `Account is ${admin.status}. Please contact support.`);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      logger.warn('Admin login attempt with invalid password', { email });
      throw new AppError('UnauthorizedError', 401, 'Invalid email or password');
    }

    logger.info('Admin login successful', { adminId: admin.id, email });

    // Return admin payload (exclude password)
    const payload: AdminPayload = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      status: admin.status,
    };

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Error during admin login', { email, error });
    throw new AppError('InternalError', 500, 'Authentication failed');
  }
};

/**
 * Get admin details (for /me endpoint)
 */
export const getAdminDetails = async (adminId: string): Promise<AdminPayload | null> => {
  try {
    const admin = await findAdminById(adminId);
    if (!admin) {
      return null;
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      status: admin.status,
    };
  } catch (error) {
    logger.error('Error getting admin details', { adminId, error });
    throw new AppError('InternalError', 500, 'Failed to fetch admin details');
  }
};
