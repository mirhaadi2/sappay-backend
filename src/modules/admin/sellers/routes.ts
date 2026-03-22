import { Router } from 'express';
import { requireAuth, requireActiveStaff, requirePermission } from '../middleware';
import {
  listSellersHandler,
  getSellerHandler,
  updateSellerHandler,
  deleteSellerHandler,
  approveSellerHandler,
  rejectSellerHandler,
  suspendSellerHandler,
  restoreSellerHandler,
} from './controller';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.sellers.read'),
  listSellersHandler
);

router.get(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.sellers.read'),
  getSellerHandler
);

router.put(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.sellers.update'),
  updateSellerHandler
);

router.delete(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.sellers.delete'),
  deleteSellerHandler
);

router.post(
  '/:id/approve',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.sellers.approve'),
  approveSellerHandler
);

router.post(
  '/:id/reject',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.sellers.reject'),
  rejectSellerHandler
);

router.post(
  '/:id/suspend',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.sellers.suspend'),
  suspendSellerHandler
);

router.post(
  '/:id/restore',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.sellers.suspend'),
  restoreSellerHandler
);

export default router;
