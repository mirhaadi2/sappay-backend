import { Router } from 'express';
import { submitBulkOrderHandler, getBulkOrdersHandler } from './controller';

const router = Router();

router.post('/', submitBulkOrderHandler);
router.get('/', getBulkOrdersHandler);

export { router as bulkOrderRoutes };
