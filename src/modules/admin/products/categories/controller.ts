import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware';
import {
  adminListCategories,
  adminGetCategory,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from './service';
import logger from '../../../../utils/logger';

export const listCategoriesHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, isActive, sortBy, sortOrder } = req.query;
    const result = await adminListCategories({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      isActive: isActive !== undefined ? (isActive === 'true') : undefined,
      sortBy: (sortBy as 'name' | 'created_at') || 'name',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('List categories error', { error });
    next(error);
  }
};

export const getCategoryHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const category = await adminGetCategory(id);
    return res.json({ success: true, data: category });
  } catch (error: any) {
    logger.error('Get category error', { error });
    next(error);
  }
};

export const createCategoryHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const category = await adminCreateCategory(payload);
    return res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    logger.error('Create category error', { error });
    next(error);
  }
};

export const updateCategoryHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const category = await adminUpdateCategory(id, payload);
    return res.json({ success: true, data: category });
  } catch (error: any) {
    logger.error('Update category error', { error });
    next(error);
  }
};

export const deleteCategoryHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await adminDeleteCategory(id);
    return res.status(204).send();
  } catch (error: any) {
    logger.error('Delete category error', { error });
    next(error);
  }
};