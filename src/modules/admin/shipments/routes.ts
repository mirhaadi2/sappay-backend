import { Router } from 'express';
import { requireAuth } from '../middleware';
import { requireActiveStaff } from '../middleware';
import { 
    getAllShipmentByOrderId, 
    getAllShipments, 
    getShipmentDetailsById, 
    getShipmentStats, 
    getTrackingInfoByWaybill, 
    updatePackageStatus, 
    updateShipmentStatus 
} from './controllers';

const router = Router();

// Apply authentication middleware
router.use(requireAuth);
router.use(requireActiveStaff);

/**
 * GET /shipments/order/:orderId
 * Get all shipments for an order
 */
router.get('/order/:orderId', getAllShipmentByOrderId);

/**
 * GET /shipments/:shipmentId
 * Get shipment details with packages
 */
router.get('/:shipmentId', getShipmentDetailsById);

/**
 * GET /shipments/tracking/:waybill
 * Get package details by waybill
 */
router.get('/tracking/:waybill', getTrackingInfoByWaybill);

/**
 * GET /shipments
 * Get shipments with optional status filter
 */
router.get('/', getAllShipments);

/**
 * GET /shipments/stats
 * Get shipment statistics
 */
router.get('/stats/summary', getShipmentStats);

/**
 * PUT /shipments/:shipmentId/status
 * Update shipment status
 */
router.put('/:shipmentId/status', updateShipmentStatus);

/**
 * PUT /shipments/packages/:waybill/status
 * Update package status
 */
router.put('/packages/:waybill/status', updatePackageStatus);

export { router as shipmentRoutes };