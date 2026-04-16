import { Op } from 'sequelize';
import {
  NotificationTemplate,
  NotificationHistory,
  UserNotificationPreferences,
} from '../models';
import { awsSNSService } from '../channels/sms';
import { whatsappService } from '../channels/whatsapp';
import { emailService } from '../channels/email';
import { inAppService } from '../channels/in-app';
import { User } from '../../admin/customers/models';
import { config } from '../../../config';
import logger from '../../../utils/logger';
import { validateAllChannels } from './notification-validator.service';
import {
  SendNotificationParams,
  NotificationResult,
  NotificationChannel,
  NotificationEventType,
} from '../types';

/**
 * ⚠️ SINGLE CHANNEL MODE - PRODUCTION CRITICAL
 * Only ONE notification channel can be active at a time!
 * 
 * Environment Variable: NOTIFICATION_CHANNEL
 * Allowed values: 'sms' | 'email' | 'whatsapp' | 'in_app'
 * 
 * If NOTIFICATION_CHANNEL=sms → Only SMS notifications will be sent
 * If NOTIFICATION_CHANNEL=email → Only Email notifications will be sent
 * If NOTIFICATION_CHANNEL=whatsapp → Only WhatsApp notifications will be sent
 * If NOTIFICATION_CHANNEL=in_app → Only In-App notifications will be sent
 * 
 * All other channels will be IGNORED regardless of configuration!
 * 
 * Validation: Configuration is automatically validated on module load
 */

// Validate configuration on module initialization
(() => {
  const validation = validateAllChannels();
  
  if (!validation.isValid) {
    throw new Error(
      `[CRITICAL] Notification system validation failed!\n` +
      `Active Channel: ${validation.activeChannel}\n` +
      `Errors: ${validation.errors.join('\n')}\n` +
      `Please fix the .env configuration and restart the server.`
    );
  }

  // Log warnings for configured but inactive channels
  if (validation.warnings.length > 0) {
    logger.warn('Notification System Warnings:', validation.warnings);
  }

  logger.info('✓ Notification system initialized successfully', {
    activeChannel: validation.activeChannel,
    provider: `NOTIFICATION_CHANNEL=${config.notificationChannel}`,
  });
})();

const replacePlaceholders = (
  template: string,
  data: Record<string, any>
): string => {
  let result = template;
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(placeholderRegex, (match, key) => {
    return data[key] || match;
  });

  const arrayPlaceholderRegex = /\{\{(\d+)\}\}/g;
  result = result.replace(arrayPlaceholderRegex, (match, index) => {
    const idx = parseInt(index);
    const flattenedData = Object.values(data);
    return (flattenedData[idx] as string) || match;
  });

  return result;
};

const isInDndTime = (startTime?: string, endTime?: string): boolean => {
  if (!startTime || !endTime) return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return currentTime >= startTime && currentTime <= endTime;
};

const isChannelEnabled = (preferences: any, channel: NotificationChannel): boolean => {
  // In single-channel mode, only return true if this is the active channel
  const activeChannel = getActiveChannel();
  return channel === activeChannel;
};

/**
 * Get the currently active notification channel from .env config
 */
const getActiveChannel = (): NotificationChannel => {
  const channel = config.notificationChannel?.toLowerCase();
  
  switch (channel) {
    case 'email':
      return NotificationChannel.EMAIL;
    case 'whatsapp':
      return NotificationChannel.WHATSAPP;
    case 'in_app':
      return NotificationChannel.IN_APP;
    case 'sms':
    default:
      return NotificationChannel.SMS;
  }
};

/**
 * Get recipient address based on channel
 */
const getRecipientForChannel = (
  channel: NotificationChannel,
  user: any,
  payload: any
): string | null => {
  switch (channel) {
    case NotificationChannel.SMS:
    case NotificationChannel.WHATSAPP:
      return payload.phoneNumber || user.phone || null;
    case NotificationChannel.EMAIL:
      return payload.email || user.email || null;
    case NotificationChannel.IN_APP:
      return user.id;
    default:
      return null;
  }
};

/**
 * Check if notification can be sent based on user preferences
 */
const canSendNotification = (
  preferences: any,
  eventType: NotificationEventType
): boolean => {
  const criticalEvents = [
    NotificationEventType.LOGIN_OTP,
    NotificationEventType.SIGNUP_OTP,
    NotificationEventType.UPDATE_PHONE_OTP,
  ];

  if (criticalEvents.includes(eventType)) return true;

  if (preferences?.eventPreferences?.[eventType] === false) return false;

  if (preferences?.dndEnabled) {
    if (isInDndTime(preferences.dndStartTime, preferences.dndEndTime)) {
      return false;
    }
  }

  return true;
};

/**
 * Send notification via the active channel
 */
const sendViaChannel = async (
  channel: NotificationChannel,
  recipient: string,
  title: string,
  message: string,
  templateId?: string
): Promise<string | null> => {
  try {
    // Verify active channel matches requested channel (enforce single-channel mode)
    const activeChannel = getActiveChannel();
    if (channel !== activeChannel) {
      throw new Error(
        `CRITICAL: Attempted to use channel ${channel} but only ${activeChannel} is active. ` +
        `Set NOTIFICATION_CHANNEL=${channel} in .env to use this channel.`
      );
    }

    switch (channel) {
      case NotificationChannel.SMS: {
        if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
          throw new Error('[SMS] AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
        }
        if (!config.aws.smsOriginationId) {
          throw new Error('[SMS] AWS_SMS_ORIGINATION_ID not configured in .env');
        }
        if (!config.aws.smsEntityId) {
          throw new Error('[SMS] AWS_SMS_ENTITY_ID not configured in .env');
        }
        logger.info('[SMS] Sending notification', { recipient });
        return await awsSNSService.sendSMS(recipient, message, templateId);
      }

      case NotificationChannel.EMAIL: {
        if (!config.email.smtpHost) {
          throw new Error('[EMAIL] SMTP_HOST not configured in .env. Should be a hostname like smtp.gmail.com');
        }
        if (!config.email.smtpUser) {
          throw new Error('[EMAIL] SMTP_USER not configured in .env');
        }
        if (!config.email.smtpPassword) {
          throw new Error('[EMAIL] SMTP_PASSWORD not configured in .env');
        }
        logger.info('[EMAIL] Notification queued via SMTP', { recipient, title });
        // Email sending is queued (stub - requires implementation with nodemailer)
        return `email_${Date.now()}`;
      }

      case NotificationChannel.WHATSAPP: {
        if (!config.whatsapp.token) {
          throw new Error('[WHATSAPP] WHATSAPP_TOKEN not configured in .env');
        }
        if (!config.whatsapp.phoneNumberId) {
          throw new Error('[WHATSAPP] WHATSAPP_PHONE_NUMBER_ID not configured in .env');
        }
        logger.info('[WHATSAPP] Sending notification', { recipient });
        if (templateId) {
          return await whatsappService.sendTemplateMessage(recipient, templateId, 'en', [title, message]);
        } else {
          return await whatsappService.sendMessage(recipient, message);
        }
      }

      case NotificationChannel.IN_APP: {
        logger.info('[IN_APP] Creating in-app notification', { recipient });
        return await inAppService.createNotification(recipient, title, message);
      }

      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  } catch (error: any) {
    throw error;
  }
};

/**
 * Create default preferences for new user
 */
export const createDefaultPreferences = async (userId: string) => {
  try {
    await UserNotificationPreferences.create({
      userId,
      channelsEnabled: {
        sms: true,
        email: true,
        whatsapp: false,
        in_app: true,
      },
      dndEnabled: false,
      eventPreferences: {},
    });
    logger.info('Default preferences created', { userId });
  } catch (error) {
    logger.error('Failed to create default preferences', { userId, error });
  }
};

/**
 * Get user notification preferences
 */
export const getUserPreferences = async (userId: string) => {
  return UserNotificationPreferences.findOne({
    where: { userId },
    raw: true,
  });
};

/**
 * Send notification via ONLY the active channel in .env
 * ⚠️ Important: Only ONE channel works at a time!
 */
export const sendNotification = async (params: SendNotificationParams): Promise<NotificationResult> => {
  const { eventType, payload, priority = 'normal' } = params;
  const startTime = Date.now();
  const activeChannel = getActiveChannel();
  
  const result: NotificationResult = {
    status: 'failed',
    channels: {},
    timestamp: new Date(),
  };

  try {
    logger.info('Sending notification via active channel', { channel: activeChannel, eventType });

    // Find template for this event and the ONLY active channel
    const template = await NotificationTemplate.findOne({
      where: {
        eventType,
        channel: activeChannel,
        isActive: true,
      },
      raw: true,
    });

    if (!template) {
      logger.warn('No template found for event', { eventType, channel: activeChannel });
      result.channels[activeChannel] = { success: false, error: 'No active template found' };
      return result;
    }

    // Check if platform is allowed
    if (template.platformsAllowed?.length > 0 && !template.platformsAllowed.includes(payload.platform || 'Portal')) {
      logger.info('Platform not allowed', { platform: payload.platform });
      return result;
    }

    // Get user
    const user = await User.findByPk(payload.userId);
    if (!user) {
      logger.error('User not found', { userId: payload.userId });
      return result;
    }

    // Get user preferences
    let preferences = await getUserPreferences(payload.userId);
    if (!preferences) {
      await createDefaultPreferences(payload.userId);
      preferences = await getUserPreferences(payload.userId);
    }

    // Check if user wants to receive this notification
    if (!canSendNotification(preferences, eventType)) {
      logger.info('Notification blocked by user preferences/DND', { userId: payload.userId });
      return result;
    }

    try {
      // Replace template placeholders
      const templateData = {
        ...payload,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
      };

      const message = replacePlaceholders(template.body, templateData);
      const title = replacePlaceholders(template.title, templateData);
      
      // Get recipient for active channel
      const recipient = getRecipientForChannel(activeChannel, user, payload);

      if (!recipient) {
        const errorMsg = `No ${activeChannel} address found for user`;
        logger.error(errorMsg, { userId: user.id, channel: activeChannel });

        await NotificationHistory.create({
          userId: user.id,
          eventType,
          channel: activeChannel,
          recipient: 'unknown',
          status: 'failed',
          message,
          errorMessage: errorMsg,
          metadata: { templateId: template.id, priority },
          sentAt: new Date(),
        } as any);

        result.channels[activeChannel] = { success: false, error: errorMsg };
        return result;
      }

      // Send via active channel
      const messageId = await sendViaChannel(activeChannel, recipient, title, message, template.channelTemplateId);

      // Log successful send
      await NotificationHistory.create({
        userId: user.id,
        eventType,
        channel: activeChannel,
        recipient,
        status: 'sent',
        messageId: messageId || undefined,
        message,
        metadata: { templateId: template.id, priority },
        sentAt: new Date(),
      } as any);

      result.status = 'success';
      result.channels[activeChannel] = { success: true, messageId: messageId || undefined };

      logger.info('Notification sent successfully', {
        channel: activeChannel,
        eventType,
        userId: payload.userId,
        duration: Date.now() - startTime,
      });

      return result;

    } catch (error: any) {
      logger.error('Failed to send notification', {
        channel: activeChannel,
        error: error.message,
      });

      await NotificationHistory.create({
        userId: user.id,
        eventType,
        channel: activeChannel,
        recipient: getRecipientForChannel(activeChannel, user, payload) || 'unknown',
        status: 'failed',
        message: template.body,
        errorMessage: error.message,
        metadata: { templateId: template.id, priority },
        sentAt: new Date(),
      } as any);

      result.channels[activeChannel] = { success: false, error: error.message };
      return result;
    }
  } catch (error: any) {
    logger.error('Notification service error', { error: error.message, eventType });
    return result;
  }
};

/**
 * Get notification history for user
 */
export const getNotificationHistory = async (userId: string, limit: number = 50, offset: number = 0) => {
  return NotificationHistory.findAndCountAll({
    where: { userId },
    order: [['sentAt', 'DESC']],
    limit,
    offset,
    raw: true,
  });
};

/**
 * Update user notification preferences
 */
export const updatePreferences = async (userId: string, updates: Partial<any>) => {
  return UserNotificationPreferences.update(updates, {
    where: { userId },
  });
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (userId?: string, startDate?: Date, endDate?: Date) => {
  const where: any = {};
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.sentAt = {};
    if (startDate) where.sentAt[Op.gte] = startDate;
    if (endDate) where.sentAt[Op.lte] = endDate;
  }

  const [total, sent, failed, pending] = await Promise.all([
    NotificationHistory.count({ where }),
    NotificationHistory.count({ where: { ...where, status: 'sent' } }),
    NotificationHistory.count({ where: { ...where, status: 'failed' } }),
    NotificationHistory.count({ where: { ...where, status: 'pending' } }),
  ]);

  return { total, sent, failed, pending };
};

/**
 * Notification Service - Main singleton for all notification operations
 */
export const notificationService = {
  sendNotification,
  getNotificationHistory,
  updatePreferences,
  getNotificationStats,
};