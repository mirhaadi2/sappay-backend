import { Router } from 'express';
import { requireAuth, requireActiveStaff, requirePermission } from '../middleware';
import {
  listUsersHandler,
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
  banUserHandler,
  unbanUserHandler,
} from './controller';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.users.read'),
  listUsersHandler
);

router.get(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.users.read'),
  getUserHandler
);

router.put(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.users.update'),
  updateUserHandler
);

router.delete(
  '/:id',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.users.delete'),
  deleteUserHandler
);

router.post(
  '/:id/ban',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.users.suspend'),
  banUserHandler
);

router.post(
  '/:id/unban',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.users.suspend'),
  unbanUserHandler
);

export default router;
