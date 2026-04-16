/**
 * Notification Services/Utilities Public API
 * 
 * Main services:
 * - notification.service.ts: Core notification sending logic
 * - notification-validator.service.ts: Configuration validation
 */

export {
  sendNotification,
  getUserPreferences,
  createDefaultPreferences,
  getNotificationHistory,
  updatePreferences,
  getNotificationStats,
  notificationService,
} from './notification.service';

export {
  validateAllChannels,
  validateActiveChannel,
  isChannelConfigured,
  NotificationChannel,
  type ValidationResult,
} from './notification-validator.service';

export type {
  SendNotificationParams,
  NotificationResult,
  NotificationChannel as NotificationChannelType,
  NotificationEventType,
} from '../types';
