import { Response } from 'express';
import {
  adminListProducts,
  adminGetProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminPublishProduct,
  adminUnpublishProduct,
  adminFeatureProduct,
  adminUnfeatureProduct,
} from './service';
import { AuthenticatedRequest } from '../middleware';
import logger from '../../../utils/logger';

export const listProductsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit, search, status, category, sortBy, sortOrder } = req.query;
    const result = await adminListProducts({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      status: (status as 'draft' | 'published') || undefined,
      category: category as string,
      sortBy: (sortBy as 'createdAt' | 'price') || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('List products error', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getProductHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await adminGetProduct(id);
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Get product error', { error });
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const updateProductHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, category } = req.body;
    const product = await adminUpdateProduct(id, { name, description, basePrice, category });
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Update product error', { error });
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const deleteProductHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await adminDeleteProduct(id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    logger.error('Delete product error', { error });
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const publishProductHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await adminPublishProduct(id);
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Publish product error', { error });
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const unpublishProductHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await adminUnpublishProduct(id);
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Unpublish product error', { error });
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const featureProductHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await adminFeatureProduct(id);
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Feature product error', { error });
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const unfeatureProductHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await adminUnfeatureProduct(id);
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Unfeature product error', { error });
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};
