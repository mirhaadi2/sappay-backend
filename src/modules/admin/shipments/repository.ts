import { Op, Transaction } from 'sequelize';
import { Shipment, ShipmentPackage } from './models';
import { Order } from '../orders/order.model';

export const findShipmentsByOrderId = async (orderId: string) => {
    return Shipment.findAll({
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

export const findShipmentById = async (shipmentId: string) => {
    return Shipment.findByPk(shipmentId, {
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

export const findShipmentByUploadWbn = async (uploadWbn: string) => {
    return Shipment.findOne({
        where: { uploadWbn },
        include: [
            {
                model: ShipmentPackage,
                as: 'packages',
            },
        ],
    });
};

export const findPackageByWaybill = async (waybill: string) => {
    return ShipmentPackage.findOne({
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

export const updateShipmentStatus = async (
    shipmentId: string,
    status: any,
    transaction?: Transaction,
) => {
    return Shipment.update({ status }, { where: { id: shipmentId }, transaction });
};

export const updatePackageStatus = async (
    waybill: string,
    status: string,
    additionalData?: any,
    transaction?: Transaction,
) => {
    const updateData: any = { status };
    if (additionalData) {
        updateData.metadata = additionalData;
    }

    return ShipmentPackage.update(updateData, {
        where: { waybill },
        transaction,
    });
};

export const findShipmentsByStatus = async (
    status: string,
    limit = 50,
    offset = 0,
    transaction?: Transaction,
) => {
    return Shipment.findAndCountAll({
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
        transaction,
    });
};

export const getShipmentStats = async () => {
    const sequelize = Shipment.sequelize!;
    const [totalShipments, statusStats, courierStats] = await Promise.all([
        Shipment.count(),
        Shipment.findAll({
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['status'],
            raw: true,
        }),
        Shipment.findAll({
            attributes: ['courier', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
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

export const bulkUpdatePackageStatuses = async (
    updates: Array<{ waybill: string; status: string; data?: any }>,
    transaction?: Transaction,
) => {
    const sequelize = Shipment.sequelize!;

    const updatePromises = updates.map(({ waybill, status, data }) => {
        const updateData: any = { status };
        if (data) {
            updateData.metadata = sequelize.fn(
                'JSON_MERGE_PATCH',
                sequelize.col('metadata'),
                JSON.stringify(data),
            );
        }

        return ShipmentPackage.update(updateData, {
            where: { waybill },
            transaction,
        });
    });

    await Promise.all(updatePromises);

    return { success: true, updated: updates.length };
};

export const findPackagesNeedingStatusUpdate = async (
    hoursSinceLastUpdate = 24,
    transaction?: Transaction,
) => {
    const cutoffDate = new Date(Date.now() - hoursSinceLastUpdate * 60 * 60 * 1000);

    return ShipmentPackage.findAll({
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
        transaction,
    });
};
