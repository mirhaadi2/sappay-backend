import { AuditLog } from '../admin/models';
import logger from '../../utils/logger';
import {
    createAuditLogRecord,
    getResourceAuditHistoryRecord,
    listAuditLogsRecord,
} from './repository';

export interface AuditLogDTO {
    actorStaffId: string;
    targetStaffId?: string;
    action: 'created' | 'updated' | 'deleted' | 'suspended' | 'activated' | 'assigned' | 'revoked';
    resourceType: 'staff' | 'admin' | 'role' | 'permission';
    resourceId: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
}

/**
 * Create audit log entry
 */
export const createAuditLog = async (data: AuditLogDTO): Promise<AuditLog> => {
    try {
        const auditLog = await createAuditLogRecord({
            actorStaffId: data.actorStaffId,
            targetStaffId: data.targetStaffId,
            action: data.action,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            oldValue: data.oldValue,
            newValue: data.newValue,
            ipAddress: '',
            userAgent: '',
        });

        logger.info(`Audit log created: ${data.action} on ${data.resourceType}`, {
            auditId: auditLog.id,
            actor: data.actorStaffId,
            resource: data.resourceId,
        });

        return auditLog;
    } catch (error) {
        logger.error('Failed to create audit log', { error, data });
        throw new Error('AUDIT_LOG_FAILED');
    }
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters: {
    actorId?: string;
    targetStaffId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}) => {
    try {
        return await listAuditLogsRecord(filters);
    } catch (error) {
        logger.error('Failed to fetch audit logs', { error, filters });
        throw new Error('AUDIT_LOG_FETCH_FAILED');
    }
};

/**
 * Get audit logs for a specific resource
 */
export const getResourceAuditHistory = async (resourceId: string, resourceType: string) => {
    try {
        return await getResourceAuditHistoryRecord(resourceId, resourceType);
    } catch (error) {
        logger.error('Failed to fetch resource audit history', { error, resourceId, resourceType });
        throw new Error('AUDIT_HISTORY_FETCH_FAILED');
    }
};
