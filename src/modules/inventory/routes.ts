import { Router } from 'express';
import {
  getInventoryHandler,
  updateStockHandler,
  checkAvailabilityHandler,
  getSellerInventoryHandler,
  getInventoryHistoryHandler,
  getSellerInventoryHistoryHandler,
} from './controller';

const router = Router();

router.get('/seller/inventory', getSellerInventoryHandler);
router.get('/seller/history', getSellerInventoryHistoryHandler);
router.get('/:id', getInventoryHandler);
router.put('/:id', updateStockHandler);
router.get('/:id/check-availability', checkAvailabilityHandler);
router.get('/:sellerProductId/history', getInventoryHistoryHandler);

export default router;
