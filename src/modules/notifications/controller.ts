import { Request, Response, NextFunction } from 'express';
import { notificationService } from './services/notification.service';
import { NotificationTemplate } from './models';
import logger from '../../utils/logger';

/**
 * Get user notification history
 */
export const getNotificationHistoryHandler = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await notificationService.getNotificationHistory(
      userId,
      limitNum,
      offset
    );

    res.json({
      success: true,
      data: {
        notifications: rows,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(count / limitNum),
        },
      },
    });
  } catch (error: any) {
    logger.error('Get notification history error', { error });
    next(error);
  }
};

/**
 * Get user notification preferences
 */
export const getPreferencesHandler = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const preferences = await notificationService.updatePreferences(req.user?.id, {});

    res.json({
      success: true,
      data: preferences || {
        channelsEnabled: {
          sms: true,
          email: true,
          whatsapp: false,
          in_app: true,
        },
        dndEnabled: false,
        eventPreferences: {},
      },
    });
  } catch (error: any) {
    logger.error('Get preferences error', { error });
    next(error);
  }
};

/**
 * Update user notification preferences
 */
export const updatePreferencesHandler = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const { channelsEnabled, dndEnabled, dndStartTime, dndEndTime, eventPreferences } =
      req.body;

    const updates: any = {};
    if (channelsEnabled) updates.channelsEnabled = channelsEnabled;
    if (dndEnabled !== undefined) updates.dndEnabled = dndEnabled;
    if (dndStartTime) updates.dndStartTime = dndStartTime;
    if (dndEndTime) updates.dndEndTime = dndEndTime;
    if (eventPreferences) updates.eventPreferences = eventPreferences;

    await notificationService.updatePreferences(req.user?.id, updates);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error: any) {
    logger.error('Update preferences error', { error });
    next(error);
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStatsHandler = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const stats = await notificationService.getNotificationStats(req.user?.id, start, end);

    res.json({
      success: true,
      data: {
        ...stats,
        successRate:
          stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0,
      },
    });
  } catch (error: any) {
    logger.error('Get notification stats error', { error });
    next(error);
  }
};

/**
 * ADMIN: Get all notification templates
 */
export const getTemplatesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventType, channel, isActive } = req.query;

    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (channel) where.channel = channel;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const templates = await NotificationTemplate.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    logger.error('Get templates error', { error });
    next(error);
  }
};

/**
 * ADMIN: Create notification template
 */
export const createTemplateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      eventType,
      channel,
      title,
      body,
      platformsAllowed,
      channelTemplateId,
      placeholders,
    } = req.body;

    const template = await NotificationTemplate.create({
      eventType,
      channel,
      title,
      body,
      platformsAllowed,
      channelTemplateId,
      placeholders,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully',
    });
  } catch (error: any) {
    logger.error('Create template error', { error });
    next(error);
  }
};

/**
 * ADMIN: Update notification template
 */
export const updateTemplateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { templateId } = req.params;
    const updates = req.body;

    const [updatedCount] = await NotificationTemplate.update(updates, {
      where: { id: templateId },
    });

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    res.json({
      success: true,
      message: 'Template updated successfully',
    });
  } catch (error: any) {
    logger.error('Update template error', { error });
    next(error);
  }
};

/**
 * ADMIN: Delete notification template
 */
export const deleteTemplateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { templateId } = req.params;

    const deletedCount = await NotificationTemplate.destroy({
      where: { id: templateId },
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete template error', { error });
    next(error);
  }
};
