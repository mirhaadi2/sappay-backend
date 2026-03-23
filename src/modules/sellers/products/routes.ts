/**
 * Seller Products Routes
 * API endpoints for seller product operations
 */

import { Router } from 'express';
import {
  addProductToSeller,
  getSellerProducts,
  updateSellerProductPrice,
  updateSellerProductStatus,
  getSellerProductDetails,
} from './controller';
import { authenticateSeller } from '../auth/middleware';

const router = Router();

// All routes require seller authentication
router.use(authenticateSeller);

/**
 * @route POST /api/sellers/products/:productId
 * @desc Add a product to seller's catalog
 * @access Private (Seller)
 */
router.post('/:productId', addProductToSeller);

/**
 * @route GET /api/sellers/products
 * @desc Get seller's products list
 * @access Private (Seller)
 */
router.get('/', getSellerProducts);

/**
 * @route GET /api/sellers/products/:sellerProductId
 * @desc Get seller product details
 * @access Private (Seller)
 */
router.get('/:sellerProductId', getSellerProductDetails);

/**
 * @route PUT /api/sellers/products/:sellerProductId/price
 * @desc Update seller product pricing
 * @access Private (Seller)
 */
router.put('/:sellerProductId/price', updateSellerProductPrice);

/**
 * @route PUT /api/sellers/products/:sellerProductId/status
 * @desc Update seller product status
 * @access Private (Seller)
 */
router.put('/:sellerProductId/status', updateSellerProductStatus);

export default router;