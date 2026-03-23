import { Router } from 'express';
import {
  getInventoryHistoryHandler,
  getSellerInventoryHistoryHandler,
} from './controller';

const router = Router();

// All routes require seller authentication (inherited from parent)
router.get('/', getSellerInventoryHistoryHandler);
router.get('/:sellerProductId', getInventoryHistoryHandler);

export default router;