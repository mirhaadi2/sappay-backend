import { Shipment, ShipmentPackage } from './models';
import { Order } from '../orders/order.model';
import { Op } from 'sequelize';

/** Get all shipments for an order */
export const getShipmentsByOrderId = async (orderId: string) => {
    return await Shipment.findAll({
        where: { orderId },
        include: [
            {
                model: ShipmentPackage,
                as: 'packages',
            },
        ],
        order: [['createdAt', 'DESC']],
    });
};

/** Get shipment by ID with packages */
export const getShipmentById = async (shipmentId: string) => {
    return await Shipment.findByPk(shipmentId, {
        include: [
            {
                model: ShipmentPackage,
                as: 'packages',
            },
            {
                model: Order,
                as: 'order',
                attributes: ['id', 'orderNumber', 'status', 'customerId'],
            },
        ],
    });
};

/** Get shipment by upload WBN */
export const getShipmentByUploadWbn = async (uploadWbn: string) => {
    return await Shipment.findOne({
        where: { uploadWbn },
        include: [
            {
                model: ShipmentPackage,
                as: 'packages',
            },
        ],
    });
};

/** Get package by waybill */
export const getPackageByWaybill = async (waybill: string) => {
    return await ShipmentPackage.findOne({
        where: { waybill },
        include: [
            {
                model: Shipment,
                as: 'shipment',
                include: [
                    {
                        model: Order,
                        as: 'order',
                        attributes: ['id', 'orderNumber', 'status', 'customerId'],
                    },
                ],
            },
        ],
    });
};

/** Update shipment status */
export const updateShipmentStatusService = async (shipmentId: string, status: any) => {
    return await Shipment.update(
        { status },
        { where: { id: shipmentId } }
    );
};

/** Update package status */
export const updatePackageStatusService = async (waybill: string, status: string, additionalData?: any) => {
    const updateData: any = { status };
    if (additionalData) {
        updateData.metadata = additionalData;
    }

    return await ShipmentPackage.update(updateData, {
        where: { waybill }
    });
};

/** Get shipments by status */
export const getShipmentsByStatus = async (status: string, limit = 50, offset = 0) => {
    return await Shipment.findAndCountAll({
        where: { status },
        include: [
            {
                model: ShipmentPackage,
                as: 'packages',
            },
            {
                model: Order,
                as: 'order',
                attributes: ['id', 'orderNumber', 'status', 'customerId'],
            },
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
};

/** Get shipment statistics */
export const getShipmentStatsService = async () => {
    const sequelize = Shipment.sequelize!;
    const [totalShipments, statusStats, courierStats] = await Promise.all([
        Shipment.count(),
        Shipment.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            group: ['status'],
            raw: true,
        }),
        Shipment.findAll({
            attributes: [
                'courier',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            group: ['courier'],
            raw: true,
        }),
    ]);

    return {
        totalShipments,
        statusBreakdown: statusStats,
        courierBreakdown: courierStats,
    };
};

/** Bulk update package statuses */
export const bulkUpdatePackageStatuses = async (updates: Array<{ waybill: string; status: string; data?: any }>) => {
    const sequelize = Shipment.sequelize!;
    const transaction = await sequelize.transaction();

    try {
        const updatePromises = updates.map(({ waybill, status, data }) => {
            const updateData: any = { status };
            if (data) {
                updateData.metadata = sequelize.fn('JSON_MERGE_PATCH', sequelize.col('metadata'), JSON.stringify(data));
            }

            return ShipmentPackage.update(updateData, {
                where: { waybill },
                transaction,
            });
        });

        await Promise.all(updatePromises);
        await transaction.commit();

        return { success: true, updated: updates.length };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/** Get packages that need status updates */
export const getPackagesNeedingStatusUpdate = async (hoursSinceLastUpdate = 24) => {
    const cutoffDate = new Date(Date.now() - hoursSinceLastUpdate * 60 * 60 * 1000);

    return await ShipmentPackage.findAll({
        where: {
            status: {
                [Op.in]: ['Success', 'In Transit'],
            },
            updatedAt: {
                [Op.lt]: cutoffDate,
            },
        },
        include: [
            {
                model: Shipment,
                as: 'shipment',
                where: {
                    status: {
                        [Op.in]: ['CREATED', 'IN_TRANSIT'],
                    },
                },
            },
        ],
        limit: 100,
    });
};