import { Router } from 'express';
import { requireAuth, requireActiveStaff, requirePermission } from '../middleware';
import {
  listProductsHandler,
  getProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  publishProductHandler,
  unpublishProductHandler,
  featureProductHandler,
  unfeatureProductHandler,
} from './controller';
import categoriesRoutes from './categories/routes';

const router = Router();

// Mount categories routes under products
router.use('/categories', categoriesRoutes);

router.get(
  '/',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.products.read'),
  listProductsHandler
);

router.post(
  '/',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.products.create'),
  createProductHandler
);

router.get(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.products.read'),
  getProductHandler
);

router.put(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.products.update'),
  updateProductHandler
);

router.delete(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.products.delete'),
  deleteProductHandler
);

router.post(
  '/:id/publish',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.products.update'),
  publishProductHandler
);

router.post(
  '/:id/unpublish',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.products.update'),
  unpublishProductHandler
);

router.post(
  '/:id/feature',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.products.update'),
  featureProductHandler
);

router.post(
  '/:id/unfeature',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.products.update'),
  unfeatureProductHandler
);

export default router;
