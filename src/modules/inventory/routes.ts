import { Router } from 'express';
import {
  getInventoryHandler,
  updateStockHandler,
  checkAvailabilityHandler,
} from './controller';

const router = Router();

router.get('/:id', getInventoryHandler);
router.put('/:id', updateStockHandler);
router.get('/:id/check-availability', checkAvailabilityHandler);

export default router;
