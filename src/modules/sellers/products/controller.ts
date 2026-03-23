/**
 * Seller Products Controller
 * HTTP request handlers for seller product operations
 */

import { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import {
  addProductToSellerService,
  getSellerProductsService,
  updateSellerProductPriceService,
  updateSellerProductStatusService,
  getSellerProductDetailsService,
} from './service';
import { SellerProductCreateInput, SellerProductUpdateInput, SellerProductsListParams } from './types';
import logger from '../../../utils/logger';

/**
 * Add a product to seller's catalog
 */
export const addProductToSeller = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).sellerId;
    const { productId } = req.params;
    const sellerData: SellerProductCreateInput = req.body;

    if (!sellerId) {
      throw new AppError('Unauthorized', 401, 'Seller not authenticated');
    }

    const result = await addProductToSellerService(sellerId, productId, sellerData);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Add product to seller error', { error });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Get seller's products list
 */
export const getSellerProducts = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).sellerId;
    const params: SellerProductsListParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as 'ACTIVE' | 'INACTIVE' | 'all',
      search: req.query.search as string,
      category: req.query.category as string,
      sortBy: (req.query.sortBy as 'createdAt' | 'sellerPrice') || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    if (!sellerId) {
      throw new AppError('Unauthorized', 401, 'Seller not authenticated');
    }

    const result = await getSellerProductsService(sellerId, params);

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Get seller products error', { error });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Update seller product pricing
 */
export const updateSellerProductPrice = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).sellerId;
    const { sellerProductId } = req.params;
    const updates: SellerProductUpdateInput = req.body;

    if (!sellerId) {
      throw new AppError('Unauthorized', 401, 'Seller not authenticated');
    }

    const result = await updateSellerProductPriceService(sellerId, sellerProductId, updates);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Update seller product price error', { error });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Update seller product status
 */
export const updateSellerProductStatus = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).sellerId;
    const { sellerProductId } = req.params;
    const { status } = req.body;

    if (!sellerId) {
      throw new AppError('Unauthorized', 401, 'Seller not authenticated');
    }

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new AppError('BadRequest', 400, 'Valid status (ACTIVE or INACTIVE) is required');
    }

    const result = await updateSellerProductStatusService(sellerId, sellerProductId, status);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Update seller product status error', { error });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Get seller product details
 */
export const getSellerProductDetails = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).sellerId;
    const { sellerProductId } = req.params;

    if (!sellerId) {
      throw new AppError('Unauthorized', 401, 'Seller not authenticated');
    }

    const result = await getSellerProductDetailsService(sellerId, sellerProductId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Get seller product details error', { error });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};