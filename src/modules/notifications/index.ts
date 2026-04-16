// Models
export { NotificationTemplate, NotificationHistory, UserNotificationPreferences } from './models';

// Types
export * from './types';

// Services
export { notificationService } from './services/notification.service';
export { notificationEmitter } from './services/notification-emitter';

// Channels
export { awsSNSService } from './channels/sms';
export { whatsappService } from './channels/whatsapp';
export { emailService } from './channels/email';
export { inAppService } from './channels/in-app';

// Controllers and Routes
export { default as notificationRoutes } from './routes';
export * from './controller';
