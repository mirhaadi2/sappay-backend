import { Router } from 'express';
import { submitBulkOrderHandler, getBulkOrdersHandler, updateBulkOrderStatusHandler } from './controller';

const router = Router();

router.post('/', submitBulkOrderHandler);
router.get('/', getBulkOrdersHandler);
router.put('/:id/status', updateBulkOrderStatusHandler);

export { router as bulkOrderRoutes };
