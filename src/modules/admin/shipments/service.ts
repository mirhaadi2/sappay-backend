import { Shipment } from './models';
import {
    findShipmentsByOrderId,
    findShipmentById,
    findShipmentByUploadWbn,
    findPackageByWaybill,
    updateShipmentStatus,
    updatePackageStatus,
    findShipmentsByStatus,
    getShipmentStats,
    bulkUpdatePackageStatuses as bulkUpdatePackageStatusesRepo,
    findPackagesNeedingStatusUpdate,
} from './repository';

/** Get all shipments for an order */
export const getShipmentsByOrderId = async (orderId: string) => {
    return await findShipmentsByOrderId(orderId);
};

/** Get shipment by ID with packages */
export const getShipmentById = async (shipmentId: string) => {
    return await findShipmentById(shipmentId);
};

/** Get shipment by upload WBN */
export const getShipmentByUploadWbn = async (uploadWbn: string) => {
    return await findShipmentByUploadWbn(uploadWbn);
};

/** Get package by waybill */
export const getPackageByWaybill = async (waybill: string) => {
    return await findPackageByWaybill(waybill);
};

/** Update shipment status */
export const updateShipmentStatusService = async (shipmentId: string, status: any) => {
    return await updateShipmentStatus(shipmentId, status);
};

/** Update package status */
export const updatePackageStatusService = async (
    waybill: string,
    status: string,
    additionalData?: any,
) => {
    return await updatePackageStatus(waybill, status, additionalData);
};

/** Get shipments by status */
export const getShipmentsByStatus = async (status: string, limit = 50, offset = 0) => {
    return await findShipmentsByStatus(status, limit, offset);
};

/** Get shipment statistics */
export const getShipmentStatsService = async () => {
    return await getShipmentStats();
};

/** Bulk update package statuses */
export const bulkUpdatePackageStatuses = async (
    updates: Array<{ waybill: string; status: string; data?: any }>,
) => {
    const sequelize = Shipment.sequelize!;
    const transaction = await sequelize.transaction();

    try {
        const result = await bulkUpdatePackageStatusesRepo(updates, transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/** Get packages that need status updates */
export const getPackagesNeedingStatusUpdate = async (hoursSinceLastUpdate = 24) => {
    return await findPackagesNeedingStatusUpdate(hoursSinceLastUpdate);
};
