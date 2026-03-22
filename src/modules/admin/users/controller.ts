import { Response } from 'express';
import {
  adminListUsers,
  adminGetUser,
  adminUpdateUser,
  adminDeleteUser,
  adminBanUser,
  adminUnbanUser,
} from './service';
import { AuthenticatedRequest } from '../middleware';
import logger from '../../../utils/logger';

export const listUsersHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const result = await adminListUsers({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      status: (status as 'active' | 'banned') || undefined,
      sortBy: (sortBy as 'createdAt' | 'email') || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('List users error', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getUserHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await adminGetUser(id);
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error('Get user error', { error });
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const updateUserHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;
    const user = await adminUpdateUser(id, { name, phone });
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error('Update user error', { error });
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const deleteUserHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await adminDeleteUser(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    logger.error('Delete user error', { error });
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const banUserHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await adminBanUser(id);
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error('Ban user error', { error });
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const unbanUserHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await adminUnbanUser(id);
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error('Unban user error', { error });
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};
