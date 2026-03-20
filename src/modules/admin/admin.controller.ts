import { Response } from 'express';
import { listAdmins, getAdminById, createAdmin, updateAdmin, deleteAdmin } from './admin.service';
import { AuthenticatedRequest } from './middleware';
import logger from '../../utils/logger';

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

export const listAdminsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admins = await listAdmins();
    res.json({ success: true, data: admins });
  } catch (error: any) {
    logger.error('List admins error', { error });
    res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const getAdminByIdHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const admin = await getAdminById(id);
    res.json({ success: true, data: admin });
  } catch (error: any) {
    const statusCode = getStatusCode(error.message);
    res.status(statusCode).json({ success: false, error: 'Admin not found', code: error.message });
  }
};

export const createAdminHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required', code: 'MISSING_FIELDS' });
    }
    const admin = await createAdmin({ email, password, name, phone });
    res.status(201).json({ success: true, data: admin });
  } catch (error: any) {
    const statusCode = getStatusCode(error.message);
    const errorMap: Record<string, string> = {
      EMAIL_ALREADY_EXISTS: 'Email already registered',
      PASSWORD_TOO_COMMON: 'Password is too common',
      INTERNAL_ERROR: 'Internal server error',
    };
    res.status(statusCode).json({ success: false, error: errorMap[error.message] || 'Invalid request', code: error.message });
  }
};

export const updateAdminHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, phone, status } = req.body;
    const admin = await updateAdmin(id, { email, name, phone, status });
    res.json({ success: true, data: admin });
  } catch (error: any) {
    const statusCode = getStatusCode(error.message);
    const errorMap: Record<string, string> = {
      INVALID_UUID: 'Invalid admin ID',
      EMAIL_ALREADY_EXISTS: 'Email already registered',
      INVALID_STATUS: 'Invalid status value',
      ADMIN_NOT_FOUND: 'Admin not found',
    };
    res.status(statusCode).json({ success: false, error: errorMap[error.message] || 'Invalid request', code: error.message });
  }
};

export const deleteAdminHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await deleteAdmin(id);
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error: any) {
    const statusCode = getStatusCode(error.message);
    const errorMap: Record<string, string> = {
      INVALID_UUID: 'Invalid admin ID',
      ADMIN_NOT_FOUND: 'Admin not found',
    };
    res.status(statusCode).json({ success: false, error: errorMap[error.message] || 'Internal server error', code: error.message });
  }
};
