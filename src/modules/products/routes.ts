import { Router } from 'express';
import {
  createProductHandler,
  getProductDetailsHandler,
  searchProductsHandler,
  getCategoriesHandler,
  addProductToSellerHandler,
  getSellerProductsHandler,
  updateProductPriceHandler,
} from './controller';

const router = Router();

// Product endpoints
router.post('/', createProductHandler);
router.get('/search', searchProductsHandler);
router.get('/:id', getProductDetailsHandler);

// Category endpoints
router.get('/categories', getCategoriesHandler);
router.get('/categories/:category/products', getProductDetailsHandler);

// Seller product endpoints
router.post('/:productId/add-to-seller', addProductToSellerHandler);
router.get('/seller/products', getSellerProductsHandler);
router.put('/seller/:sellerProductId/price', updateProductPriceHandler);

export default router;
