import { NextFunction, Response } from 'express';
import {
  adminListProducts,
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminPublishProduct,
  adminUnpublishProduct,
  adminFeatureProduct,
  adminUnfeatureProduct,
} from './service';
import { AuthenticatedRequest } from '../middleware';
import logger from '../../../utils/logger';
import { AppError } from '../../../utils/AppError';

export const listProductsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    next(error);
  }
};

export const getProductHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sellerOfferingsPage = parseInt(req.query.sellerOfferingsPage as string) || 1;
    const sellerOfferingsLimit = parseInt(req.query.sellerOfferingsLimit as string) || 10;

    // Validate pagination params
    if (sellerOfferingsPage < 1 || sellerOfferingsLimit < 1 || sellerOfferingsLimit > 100) {
      throw new AppError('ValidationError', 400, 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100');
    }

    const product = await adminGetProduct(id, sellerOfferingsPage, sellerOfferingsLimit);
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Get product error', { error });
    next(error);
  }
};

export const createProductHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const addedBy = req?.session?.admin?.id || req?.session?.staff?.id;
  try {
    const {
      name,
      slug,
      description,
      descriptionDetails,
      gst_rate,
      status,
      categoryId,
      category,
      images,
      sellerId,
      variants,
      stock = 0,
      isNew,
      isCustomerFavourites,
      isBestseller,
      benefits,
      ingredients,
      nutritionFacts,
    } = req.body;

    const product = await adminCreateProduct({
      name,
      slug,
      description,
      descriptionDetails,
      gst_rate,
      status,
      categoryId: categoryId || category,
      images,
      sellerId,
      variants,
      addedBy,
      stock,
      isNew,
      isCustomerFavourites,
      isBestseller,
      benefits,
      ingredients,
      nutritionFacts,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Create product error', { error });
    next(error);
  }
};

export const updateProductHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      descriptionDetails,
      category,
      gst_rate,
      isNew,
      isCustomerFavourites,
      isBestseller,
      status,
      variants,
      images,
      benefits,
      ingredients,
      nutritionFacts,
    } = req.body;
    const product = await adminUpdateProduct(id, {
      name,
      slug,
      description,
      descriptionDetails,
      category,
      gst_rate,
      isNew,
      isCustomerFavourites,
      isBestseller,
      status,
      variants,
      images,
      benefits,
      ingredients,
      nutritionFacts,
    });
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Update product error', { error });
    next(error);
  }
};

export const deleteProductHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await adminDeleteProduct(id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    logger.error('Delete product error', { error });
    next(error);
  }
};

export const publishProductHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await adminPublishProduct(id);
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Publish product error', { error });
    next(error);
  }
};

export const unpublishProductHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await adminUnpublishProduct(id);
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Unpublish product error', { error });
    next(error);
  }
};

export const featureProductHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await adminFeatureProduct(id);
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Feature product error', { error });
    next(error);
  }
};

export const unfeatureProductHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await adminUnfeatureProduct(id);
    res.json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Unfeature product error', { error });
    next(error);
  }
};
