import { Router } from 'express';
import {
  getInventoryHandler,
  updateStockHandler,
  checkAvailabilityHandler,
  getSellerInventoryHandler,
  addInventoryStockHandler,
} from './controller';
import { authenticateSeller } from '../auth/middleware';
import { historiesRoutes } from './histories';

const router = Router();

// All routes require seller authentication
router.use(authenticateSeller);

// Mount histories submodule
router.use('/histories', historiesRoutes);

// Seller inventory routes
router.get('/', getSellerInventoryHandler);
router.post('/:sellerProductId/add-stock', addInventoryStockHandler);
router.get('/:id', getInventoryHandler);
router.put('/:id', updateStockHandler);
router.get('/:id/check-availability', checkAvailabilityHandler);


export default router;
