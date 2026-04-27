import { Router } from 'express';
import { checkPincode, trackShipment } from './controller';

const router = Router();

router.get('/pincode/:pincode', checkPincode);
router.get('/track/:waybill', trackShipment);

export { router as delhiveryRoutes };