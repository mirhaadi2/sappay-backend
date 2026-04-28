import { NextFunction, Response, Request } from 'express';
import { getPackageByWaybill, getShipmentById, getShipmentsByOrderId, getShipmentsByStatus, getShipmentStatsService, updatePackageStatusService, updateShipmentStatusService } from './service';

export const getAllShipmentByOrderId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req.params;
        const shipments = await getShipmentsByOrderId(orderId);
        res.json({ success: true, data: shipments });
    } catch (error) {
        next(error);
    }
};

export const getShipmentDetailsById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { shipmentId } = req.params;
        const shipment = await getShipmentById(shipmentId);

        if (!shipment) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }

        res.json({ success: true, data: shipment });
    } catch (error) {
        next(error);
    }
};

export const getTrackingInfoByWaybill = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { waybill } = req.params;
        const packageData = await getPackageByWaybill(waybill);

        if (!packageData) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        res.json({ success: true, data: packageData });
    } catch (error) {
        next(error);
    }
};

export const getAllShipments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        if (status) {
            const result = await getShipmentsByStatus(
                status as string,
                parseInt(limit as string),
                parseInt(offset as string)
            );
            res.json({ success: true, data: result.rows, total: result.count });
        } else {
            // Return recent shipments if no status filter
            const result = await getShipmentsByStatus(
                'CREATED',
                parseInt(limit as string),
                parseInt(offset as string)
            );
            res.json({ success: true, data: result.rows, total: result.count });
        }
    } catch (error) {
        next(error);
    }
};

export const getShipmentStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await getShipmentStatsService();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

export const updateShipmentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { shipmentId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const [updatedRows] = await updateShipmentStatusService(shipmentId, status);

        if (updatedRows === 0) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }

        res.json({ success: true, message: 'Shipment status updated' });
    } catch (error) {
        next(error);
    }
};

export const updatePackageStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
        const { waybill } = req.params;
        const { status, additionalData } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const [updatedRows] = await updatePackageStatusService(waybill, status, additionalData);

        if (updatedRows === 0) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        res.json({ success: true, message: 'Package status updated' });
    } catch (error) {
        next(error);
    }
}