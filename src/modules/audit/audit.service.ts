import { AuditLog } from '../admin/models';
import logger from '../../utils/logger';

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
    const auditLog = await AuditLog.create({
      actorStaffId: data.actorStaffId,
      targetStaffId: data.targetStaffId || data.actorStaffId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      oldValue: data.oldValue,
      newValue: data.newValue,
      ipAddress: '', // Set from middleware context
      userAgent: '', // Set from middleware context
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
    const where: any = {};

    if (filters.actorId) where.actorStaffId = filters.actorId;
    if (filters.targetStaffId) where.targetStaffId = filters.targetStaffId;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt[Symbol.for('gte')] = filters.startDate;
      if (filters.endDate) where.createdAt[Symbol.for('lte')] = filters.endDate;
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
    const logs = await AuditLog.findAll({
      where: {
        resourceId,
        resourceType,
      },
      order: [['createdAt', 'DESC']],
    });

    return logs;
  } catch (error) {
    logger.error('Failed to fetch resource audit history', { error, resourceId, resourceType });
    throw new Error('AUDIT_HISTORY_FETCH_FAILED');
  }
};
