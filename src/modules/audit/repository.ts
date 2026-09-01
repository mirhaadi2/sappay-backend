import { Op, Transaction } from 'sequelize';
import { AuditLog } from '../admin/models';

export interface AuditLogQueryFilters {
    actorId?: string;
    targetStaffId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

export const createAuditLogRecord = async (
    data: {
        actorStaffId: string;
        targetStaffId?: string;
        action: string;
        resourceType: string;
        resourceId: string;
        oldValue?: Record<string, any>;
        newValue?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
    },
    transaction?: Transaction,
) => {
    return AuditLog.create(
        {
            actorStaffId: data.actorStaffId,
            targetStaffId: data.targetStaffId || data.actorStaffId,
            action: data.action,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            oldValue: data.oldValue,
            newValue: data.newValue,
            ipAddress: data.ipAddress || '',
            userAgent: data.userAgent || '',
        },
        { transaction },
    );
};

export const listAuditLogsRecord = async (filters: AuditLogQueryFilters = {}) => {
    const where: any = {};

    if (filters.actorId) where.actorStaffId = filters.actorId;
    if (filters.targetStaffId) where.targetStaffId = filters.targetStaffId;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;

    if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt[Op.gte] = filters.startDate;
        if (filters.endDate) where.createdAt[Op.lte] = filters.endDate;
    }

    const { count, rows } = await AuditLog.findAndCountAll({
        where,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        order: [['createdAt', 'DESC']],
    });

    return {
        logs: rows,
        total: count,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
    };
};

export const getResourceAuditHistoryRecord = async (resourceId: string, resourceType: string) => {
    return AuditLog.findAll({
        where: {
            resourceId,
            resourceType,
        },
        order: [['createdAt', 'DESC']],
    });
};
