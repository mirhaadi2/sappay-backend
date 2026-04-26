import { NextFunction, Response } from 'express';
import { listAdmins, getAdminById, createAdmin, updateAdmin, deleteAdmin } from './admin.service';
import { AuthenticatedRequest } from './middleware';
import logger from '../../utils/logger';
import { AppError } from '../../utils/AppError';

const getStatusCode = (errorCode: string): number => {
  const codeMap: Record<string, number> = {
    INVALID_UUID: 400,
    EMAIL_ALREADY_EXISTS: 409,
    INVALID_STATUS: 400,
    ADMIN_NOT_FOUND: 404,
    PASSWORD_TOO_COMMON: 400,
    INTERNAL_ERROR: 500,
  };
  return codeMap[errorCode] || 500;
};

export const listAdminsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const admins = await listAdmins();
    res.json({ success: true, data: admins });
  } catch (error: any) {
    logger.error('List admins error', { error });
    next(error);
  }
};

export const getAdminByIdHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const admin = await getAdminById(id);
    res.json({ success: true, data: admin });
  } catch (error: any) {
    next(error);
  }
};

export const createAdminHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password) {
      throw new AppError('ValidationError', 400, 'Email and password are required');
    }
    const admin = await createAdmin({ email, password, name, phone });
    res.status(201).json({ success: true, data: admin });
  } catch (error: any) {
    next(error);
  }
};

export const updateAdminHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, name, phone, status } = req.body;
    const admin = await updateAdmin(id, { email, name, phone, status });
    res.json({ success: true, data: admin });
  } catch (error: any) {
    next(error);
  }
};

export const deleteAdminHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await deleteAdmin(id);
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error: any) {
    next(error);
  }
};
