import { Admin } from './admin.model';
import bcrypt from 'bcrypt';
import { sequelize } from '../../db/sequelize';
import { logger } from '../../utils/logger';
import { 
  validateCreateAdmin, 
  validateUpdateAdmin, 
  validateUUID 
} from '../shared/validators';

/**
 * List all admins (excludes passwords)
 */
export const listAdmins = async () => {
  try {
    return await Admin.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    logger.error('Error listing admins', { error });
    throw new Error('INTERNAL_ERROR');
  }
};

/**
 * Get admin by ID
 */
export const getAdminById = async (id: string) => {
  // Validate UUID format
  const validation = validateUUID(id, 'id');
  if (!validation.valid) {
    throw new Error('INVALID_UUID');
  }
  
  try {
    const admin = await Admin.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
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
export const createAdmin = async (data: { email: string; password: string; name?: string; phone?: string; status?: string }) => {
  // Validate input
  const validation = validateCreateAdmin(data);
  if (!validation.valid) {
    logger.warn('Admin creation validation failed', { errors: validation.errors });
    throw new Error('VALIDATION_ERROR');
  }

  const transaction = await sequelize.transaction();
  try {
    // Normalize email to lowercase
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = await Admin.findOne({ where: { email: normalizedEmail } });
    if (existing) throw new Error('EMAIL_ALREADY_EXISTS');
    
    const hashedPassword = await bcrypt.hash(data.password, 12); // Cost factor 12 for enterprise
    const admin = await Admin.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: data.name?.trim(),
      phone: data.phone?.trim(),
      status: (data.status as any) ?? 'active',
    }, { transaction });
    
    await transaction.commit();
    logger.info('Admin created', { adminId: admin.id, email: normalizedEmail });
    
    const result = admin.toJSON();
    delete (result as any).password;
    return result;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating admin', { email: data.email, error });
    throw error;
  }
};

/**
 * Update admin
 */
export const updateAdmin = async (id: string, data: { email?: string; name?: string; phone?: string; status?: string }) => {
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
  
  const transaction = await sequelize.transaction();
  try {
    const admin = await Admin.findByPk(id, { transaction });
    if (!admin) throw new Error('ADMIN_NOT_FOUND');
    
    if (data.email) {
      const normalizedEmail = data.email.toLowerCase().trim();
      if (normalizedEmail !== admin.email) {
        const existing = await Admin.findOne({ where: { email: normalizedEmail } });
        if (existing) throw new Error('EMAIL_ALREADY_EXISTS');
      }
      admin.email = normalizedEmail;
    }
    
    if (data.name !== undefined) admin.name = data.name?.trim();
    if (data.phone !== undefined) admin.phone = data.phone?.trim();
    if (data.status !== undefined) admin.status = data.status as any;
    
    await admin.save({ transaction });
    await transaction.commit();
    
    logger.info('Admin updated', { adminId: id });
    
    const result = admin.toJSON();
    delete (result as any).password;
    return result;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating admin', { adminId: id, error });
    throw error;
  }
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
  
  const transaction = await sequelize.transaction();
  try {
    const admin = await Admin.findByPk(id, { transaction });
    if (!admin) throw new Error('ADMIN_NOT_FOUND');
    
    await admin.destroy({ transaction });
    await transaction.commit();
    
    logger.warn('Admin deleted', { adminId: id, email: admin.email });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting admin', { adminId: id, error });
    throw error;
  }
};
