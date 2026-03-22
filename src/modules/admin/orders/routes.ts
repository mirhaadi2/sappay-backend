import { Router } from 'express';
import { requireAuth, requireActiveStaff, requirePermission } from '../middleware';
import {
  listOrdersHandler,
  getOrderHandler,
  updateOrderStatusHandler,
  refundOrderHandler,
  cancelOrderHandler,
  disputeOrderHandler,
} from './controller';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.orders.read'),
  listOrdersHandler
);

router.get(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.orders.read'),
  getOrderHandler
);

router.put(
  '/:id/status',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.orders.update'),
  updateOrderStatusHandler
);

router.post(
  '/:id/refund',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.orders.refund'),
  refundOrderHandler
);

router.post(
  '/:id/cancel',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.orders.cancel'),
  cancelOrderHandler
);

router.post(
  '/:id/dispute',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.orders.update'),
  disputeOrderHandler
);

export default router;
