import { Router } from 'express';
import { handleCreateShipment } from './controllers';
import { requireAuth } from '../../middleware';
import { requireActiveStaff } from '../../middleware';

const router = Router();

router.use(requireAuth);
router.use(requireActiveStaff);

router.post('/shipment', handleCreateShipment);

export { router as delhiveryAdminRoutes };