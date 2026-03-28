/**
 * Seller Routes
 * Main router for seller operations with submodules
 */

import { Router } from 'express';
import {
  getProfileHandler,
  updateProfileHandler,
  getDashboardHandler,
  listSellersHandler,
  approveSellerHandler,
  rejectSellerHandler,
  reapplySellerHandler,
  suspendSellerHandler,
  sellerProfileHandler,
  getSellerMeHandler,
  changePasswordHandler,
  getNotificationPreferencesHandler,
  updateNotificationPreferencesHandler,
  getSellerForReapplyHandler,
  updateSellerForReapplyHandler,
} from './controller';
import { requireAuth } from '../../middleware/auth.middleware';

// Import submodules
import { sellerAuthRoutes } from './auth';
import { sellerProductsRoutes } from './products';
import { sellerInventoryRoutes } from './inventory';

const router = Router();

// Mount auth submodule
router.use('/auth', sellerAuthRoutes);

// Mount products submodule
router.use('/products', sellerProductsRoutes);

// Mount inventory submodule
router.use('/inventory', sellerInventoryRoutes);

router.get('/reapply', getSellerForReapplyHandler);

// Protected routes (auth required)
router.get('/me', requireAuth, getSellerMeHandler);
router.get('/profile', requireAuth, sellerProfileHandler);
router.get('/:id', getProfileHandler);
router.put('/:id', requireAuth, updateProfileHandler);
router.get('/:id/dashboard', requireAuth, getDashboardHandler);

// Password & Preferences routes (auth required)
router.post('/password/change', requireAuth, changePasswordHandler);
router.get('/preferences/notifications', requireAuth, getNotificationPreferencesHandler);
router.put('/preferences/notifications', requireAuth, updateNotificationPreferencesHandler);

// Public routes (no auth required for reapply)
router.put('/:id/reapply', updateSellerForReapplyHandler);

// Admin routes
router.get('/', listSellersHandler);
// router.post('/:id/approve', approveSellerHandler);
// router.post('/:id/reject', rejectSellerHandler);
// router.post('/:id/reapply', reapplySellerHandler);
// router.post('/:id/suspend', suspendSellerHandler);

export default router;
