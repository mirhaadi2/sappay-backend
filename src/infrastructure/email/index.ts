import { config } from '../../config';
import { emailTransporter, EmailAccountType } from './transporter';
import { emailTemplates } from './templates';

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    fromMailType?: EmailAccountType;
}

export const sendEmail = async (options: SendEmailOptions) => {
    const mailOptions = {
        from: options.from || `"Sappey Support" <${config.email.smtpHost}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]+>/g, ''),
    };

    try {
        const result = await emailTransporter(options.fromMailType || 'support').sendMail(
            mailOptions,
        );
        console.log(`✅ Email sent to ${options.to}`);
        return result;
    } catch (error) {
        console.error(`❌ Failed to send email to ${options.to}:`, error);
        throw error;
    }
};

export const sendOtpToEmail = async (email: string, code: string) => {
    return sendEmail({
        to: email,
        subject: 'Your Sappey Verification Code',
        html: emailTemplates.verificationOtp(code),
        fromMailType: 'support',
    });
};

export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
    return sendEmail({
        to: email,
        subject: 'Reset Your Sappey Password',
        html: emailTemplates.passwordReset(resetLink),
        fromMailType: 'support',
    });
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    return sendEmail({
        to: email,
        subject: 'Welcome to Sappey! Registration Received',
        html: emailTemplates.sellerWelcome(email, name),
        fromMailType: 'support',
    });
};

export const sendSellerApprovalEmail = async (email: string, name: string) => {
    return sendEmail({
        to: email,
        subject: 'Sappey Seller Account Approved',
        html: emailTemplates.sellerApproval(
            name,
            `${process.env.FRONTEND_URL || 'https://local.host'}/login`,
        ),
        fromMailType: 'support',
    });
};

export const sendSellerRejectionEmail = async (email: string, name: string, reason: string) => {
    return sendEmail({
        to: email,
        subject: 'Sappey Seller Account Rejected',
        html: emailTemplates.sellerRejection(
            name,
            reason,
            `${process.env.FRONTEND_URL || 'https://local.host'}/signup`,
        ),
        fromMailType: 'support',
    });
};

export const sendSellerReapplyConfirmationEmail = async (email: string, name: string) => {
    return sendEmail({
        to: email,
        subject: 'Sappey Seller Reapplication Received',
        html: emailTemplates.reapplyConfirmation(name),
        fromMailType: 'support',
    });
};

export const sendNewOrderNotificationEmail = async (
    orderNumber: string,
    customerEmail: string,
    finalAmount: number,
    fromMailType: EmailAccountType = 'sales',
) => {
    return sendEmail({
        to: config.email.salesTeamEmail,
        subject: 'New Order Notification',
        html: emailTemplates.newOrderNotification({ orderNumber, customerEmail, finalAmount }),
        fromMailType,
    });
};

export const sendOrderConfirmationEmail = async (
    email: string,
    orderNumber: string,
    finalAmount: number,
    fromMailType: EmailAccountType = 'sales',
) => {
    return sendEmail({
        to: email,
        subject: 'Order Confirmation - Sappay',
        html: emailTemplates.orderConfirmation({ orderNumber, finalAmount }),
        from: config.email.salesTeamEmail,
        fromMailType,
    });
};

export { emailTransporter, emailTemplates };
