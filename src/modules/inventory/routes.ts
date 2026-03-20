import { Router } from 'express';
import {
  getInventoryHandler,
  updateStockHandler,
  checkAvailabilityHandler,
  getSellerInventoryHandler,
} from './controller';

const router = Router();

router.get('/seller/inventory', getSellerInventoryHandler);
router.get('/:id', getInventoryHandler);
router.put('/:id', updateStockHandler);
router.get('/:id/check-availability', checkAvailabilityHandler);

export default router;
