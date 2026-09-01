export {
    sendEmail,
    sendOtpToEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    sendSellerApprovalEmail,
    sendSellerRejectionEmail,
    sendSellerReapplyConfirmationEmail,
    sendNewOrderNotificationEmail,
    sendOrderConfirmationEmail,
    emailTransporter,
    emailTemplates,
} from '../infrastructure/email';

export type { SendEmailOptions } from '../infrastructure/email';
