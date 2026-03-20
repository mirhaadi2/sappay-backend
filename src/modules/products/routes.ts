import { Router } from 'express';
import {
  createProductHandler,
  getProductDetailsHandler,
  fetchProductsHandler,
  getCategoriesHandler,
  createCategoryHandler,
  addProductToSellerHandler,
  getSellerProductsHandler,
  updateProductPriceHandler,
  updateProductStatusHandler,
} from './controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// 1. Category endpoints (MOVE THESE UP)
// These are specific strings like "/categories", so they should be checked first.
router.get('/categories', getCategoriesHandler);
router.post('/categories', createCategoryHandler);
router.get('/categories/:category/products', getProductDetailsHandler);

// 2. Seller product endpoints
router.get('/seller/products', getSellerProductsHandler);
router.put('/seller/:sellerProductId/price', updateProductPriceHandler);

// 3. Product endpoints
router.post('/', requireAuth, createProductHandler);
router.get('/', fetchProductsHandler);

// 4. Dynamic Parameter endpoints (MOVE THIS TO THE BOTTOM)
// This is a "greedy" route. It should only run if nothing else matches.
router.get('/:id', getProductDetailsHandler);
router.post('/:productId/add-to-seller', addProductToSellerHandler);
router.patch('/:sellerProductId/status', updateProductStatusHandler);

export default router;
