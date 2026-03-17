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
} from './controller';

const router = Router();

// Seller routes
router.post('/register', registerSellerHandler);
router.get('/:id', getProfileHandler);
router.put('/:id', updateProfileHandler);
router.get('/:id/dashboard', getDashboardHandler);

// Admin routes
router.get('/', listSellersHandler);
router.post('/:id/approve', approveSellerHandler);
router.post('/:id/reject', rejectSellerHandler);
router.post('/:id/suspend', suspendSellerHandler);

export default router;
