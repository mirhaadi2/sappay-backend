import { Router } from 'express';
import {
  listCategoriesHandler,
  getCategoryHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from './controller';
import { requireAuth, requireActiveStaff, requirePermission } from '../middleware';

const router = Router();

router.get('/', requireAuth, requireActiveStaff, requirePermission('admin.categories.read'), listCategoriesHandler);
router.get('/:id', requireAuth, requireActiveStaff, requirePermission('admin.categories.read'), getCategoryHandler);
router.post('/', requireAuth, requireActiveStaff, requirePermission('admin.categories.create'), createCategoryHandler);
router.patch('/:id', requireAuth, requireActiveStaff, requirePermission('admin.categories.update'), updateCategoryHandler);
router.delete('/:id', requireAuth, requireActiveStaff, requirePermission('admin.categories.delete'), deleteCategoryHandler);

export default router;