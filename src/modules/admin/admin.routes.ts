import { Router } from 'express';
import { requireAuth, requireActiveStaff, requirePermission } from './middleware';
import { listAdminsHandler, getAdminByIdHandler, createAdminHandler, updateAdminHandler, deleteAdminHandler } from './admin.controller';

const router = Router();

router.get('/admins', requireAuth, requireActiveStaff, requirePermission('admin.admins.read'), listAdminsHandler);
router.get('/admins/:id', requireAuth, requireActiveStaff, requirePermission('admin.admins.read'), getAdminByIdHandler);
router.post('/admins', requireAuth, requireActiveStaff, requirePermission('admin.admins.create'), createAdminHandler);
router.patch('/admins/:id', requireAuth, requireActiveStaff, requirePermission('admin.admins.update'), updateAdminHandler);
router.delete('/admins/:id', requireAuth, requireActiveStaff, requirePermission('admin.admins.delete'), deleteAdminHandler);

export { router as adminCrudRouter };
