import { Router } from 'express';
import {
  createProductHandler,
  getProductDetailsHandler,
  fetchProductsHandler,
  searchProductsHandler,
  getCategoriesHandler,
  createCategoryHandler,
  addProductToSellerHandler,
  getSellerProductsHandler,
  updateProductPriceHandler,
  updateProductStatusHandler,
} from './controller';
import { requireAuth } from '../../../middleware/auth.middleware';

const router = Router();

// 1. Category endpoints (SPECIFIC STRINGS - CHECK FIRST)
// These are specific strings like "/categories", so they should be checked first.
router.get('/categories', getCategoriesHandler);
router.post('/categories', createCategoryHandler);
router.get('/categories/:category/products', getProductDetailsHandler);

// 2. Dedicated Search Endpoint (BEFORE GENERIC ROUTES)
// Search uses PostgreSQL Full-Text Search with proper ranking
// Endpoint: GET /products/search?q=almonds&sort=newest&limit=20
router.get('/search', searchProductsHandler);

// 3. Seller product endpoints
router.get('/seller/products', requireAuth, getSellerProductsHandler);
router.put('/seller/:sellerProductId/price', updateProductPriceHandler);

// 4. Generic product endpoints (AFTER SPECIFIC ROUTES)
router.post('/', requireAuth, createProductHandler);
router.get('/', fetchProductsHandler);

// 5. Dynamic Parameter endpoints (MOVE THIS TO THE BOTTOM - GREEDY ROUTES)
// This is a "greedy" route. It should only run if nothing else matches.
router.get('/:id', getProductDetailsHandler);
router.post('/:productId/add-to-seller', addProductToSellerHandler);
router.patch('/:sellerProductId/status', updateProductStatusHandler);

export default router;
