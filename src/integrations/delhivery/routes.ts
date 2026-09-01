import { Router } from 'express';
import { checkPincode, trackShipment, editShipmentHandler, cancelShipmentHandler, updateEwaybillHandler, calculateChargesHandler, generatePackingSlipHandler, createPickupRequestHandler } from './controller';

const router = Router();

router.get('/pincode/:pincode', checkPincode);
router.get('/track/:waybill', trackShipment);
router.post('/shipment/edit', editShipmentHandler);
router.post('/shipment/cancel', cancelShipmentHandler);
router.put('/ewaybill/:waybill', updateEwaybillHandler);
router.get('/charges', calculateChargesHandler);
router.get('/packing-slip', generatePackingSlipHandler);
router.post('/pickup', createPickupRequestHandler);

export { router as delhiveryRoutes };