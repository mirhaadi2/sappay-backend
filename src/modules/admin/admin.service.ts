import bcrypt from 'bcrypt';
import { logger } from '../../utils/logger';
import { validateCreateAdmin, validateUpdateAdmin, validateUUID } from '../shared/validators';
import { withTransaction } from '../../utils/transaction';
import {
    findAllAdmins,
    findAdminById,
    findAdminByEmail,
    createAdminRecord,
    updateAdminRecord,
    deleteAdminRecord,
} from './repository';

/**
 * List all admins (excludes passwords)
 */
export const listAdmins = async () => {
    try {
        return await findAllAdmins();
    } catch (error) {
        logger.error('Error listing admins', { error });
        throw new Error('INTERNAL_ERROR');
    }
};

/**
 * Get admin by ID
 */
export const getAdminById = async (id: string) => {
    const validation = validateUUID(id, 'id');
    if (!validation.valid) {
        throw new Error('INVALID_UUID');
    }

    try {
        const admin = await findAdminById(id);
        if (!admin) throw new Error('ADMIN_NOT_FOUND');
        return admin;
    } catch (error) {
        logger.error('Error fetching admin', { adminId: id, error });
        throw error;
    }
};

/**
 * Create new admin
 */
export const createAdmin = async (data: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    status?: string;
}) => {
    // Validate input
    const validation = validateCreateAdmin(data);
    if (!validation.valid) {
        logger.warn('Admin creation validation failed', { errors: validation.errors });
        throw new Error('VALIDATION_ERROR');
    }

    return withTransaction(async (transaction) => {
        const normalizedEmail = data.email.toLowerCase().trim();
        const existing = await findAdminByEmail(normalizedEmail, transaction);
        if (existing) throw new Error('EMAIL_ALREADY_EXISTS');

        const hashedPassword = await bcrypt.hash(data.password, 12);
        const admin = await createAdminRecord(
            {
                email: normalizedEmail,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                status: data.status,
            },
            transaction,
        );

        logger.info('Admin created', { adminId: admin.id, email: normalizedEmail });

        const result = admin.toJSON();
        delete (result as any).password;
        return result;
    });
};

/**
 * Update admin
 */
export const updateAdmin = async (
    id: string,
    data: { email?: string; name?: string; phone?: string; status?: string },
) => {
    // Validate UUID
    const uuidValidation = validateUUID(id, 'id');
    if (!uuidValidation.valid) {
        throw new Error('INVALID_UUID');
    }

    // Validate update data
    const validation = validateUpdateAdmin(data);
    if (!validation.valid) {
        logger.warn('Admin update validation failed', { adminId: id, errors: validation.errors });
        throw new Error('VALIDATION_ERROR');
    }

    return withTransaction(async (transaction) => {
        const admin = await findAdminById(id, transaction);
        if (!admin) throw new Error('ADMIN_NOT_FOUND');

        if (data.email) {
            const normalizedEmail = data.email.toLowerCase().trim();
            if (normalizedEmail !== admin.email) {
                const existing = await findAdminByEmail(normalizedEmail, transaction);
                if (existing) throw new Error('EMAIL_ALREADY_EXISTS');
            }
        }

        const updatedAdmin = await updateAdminRecord(admin, data, transaction);

        logger.info('Admin updated', { adminId: id });

        const result = updatedAdmin.toJSON();
        delete (result as any).password;
        return result;
    });
};

/**
 * Delete admin (soft delete)
 */
export const deleteAdmin = async (id: string) => {
    // Validate UUID
    const validation = validateUUID(id, 'id');
    if (!validation.valid) {
        throw new Error('INVALID_UUID');
    }

    return withTransaction(async (transaction) => {
        const admin = await findAdminById(id, transaction);
        if (!admin) throw new Error('ADMIN_NOT_FOUND');

        await deleteAdminRecord(id, transaction);
        logger.warn('Admin deleted', { adminId: id, email: admin.email });
    });
};
