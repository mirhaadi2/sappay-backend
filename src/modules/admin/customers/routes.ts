import { Router } from 'express';
import { requireAuth, requireActiveStaff, requirePermission } from '../middleware';
import {
  listUsersHandler,
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
  banUserHandler,
  unbanUserHandler,
  createUserHandler,
} from './controller';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.customers.read'),
  listUsersHandler
);

router.post(
  '/',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.customers.create'),
  createUserHandler
);

router.get(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.customers.read'),
  getUserHandler
);

router.put(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.customers.update'),
  updateUserHandler
);

router.delete(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.customers.delete'),
  deleteUserHandler
);

router.post(
  '/:id/ban',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.customers.suspend'),
  banUserHandler
);

router.post(
  '/:id/unban',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.customers.suspend'),
  unbanUserHandler
);

export default router;
