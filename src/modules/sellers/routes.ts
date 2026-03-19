import { Router } from 'express';
import {
  registerSellerHandler,
  getProfileHandler,
  updateProfileHandler,
  getDashboardHandler,
  listSellersHandler,
  approveSellerHandler,
  rejectSellerHandler,
  suspendSellerHandler,
  sellerProfileHandler,
  loginSellerHandler,
  getSellerMeHandler,
  logoutSellerHandler,
} from './controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Public routes (no auth required)
router.post('/register', registerSellerHandler);
router.post('/login', loginSellerHandler);
router.post('/logout', logoutSellerHandler);

// Protected routes (auth required)
router.get('/me', requireAuth, getSellerMeHandler);
router.get('/profile', requireAuth, sellerProfileHandler);
router.get('/:id', getProfileHandler);
router.put('/:id', requireAuth, updateProfileHandler);
router.get('/:id/dashboard', requireAuth, getDashboardHandler);

// Admin routes
router.get('/', listSellersHandler);
router.post('/:id/approve', approveSellerHandler);
router.post('/:id/reject', rejectSellerHandler);
router.post('/:id/suspend', suspendSellerHandler);

export default router;
