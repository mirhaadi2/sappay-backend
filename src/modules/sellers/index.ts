/**
 * Seller Module
 * Main exports for seller functionality
 */

// Legacy exports (to be moved to submodules)
export { Seller, SellerStatus, BusinessType } from './model';
export * from './repository';
export * from './service';
export * from './controller';
export { default as sellerRoutes } from './routes';

// Submodule exports
export { default as sellerAuthRoutes } from './auth/routes';
export { default as sellerProductsRoutes } from './products/routes';
