import { emailTransporter } from "./emailTransporter";
import { config } from "../config/index";
import { verificationOtpTemplate } from "../modules/templates/VerificationOtpTemplate";
import { sellerWelcomeTemplate } from "../modules/templates/SellerWelcomeTemplate";
import { passwordResetTemplate } from "../modules/templates/PasswordResetTemplate";
import { sellerApprovalTemplate } from "../modules/templates/SellerApprovalTemplate";
import { sellerRejectionTemplate } from "../modules/templates/SellerRejectionTemplate";
import { reapplyConfirmationTemplate } from "../modules/templates/ReapplySellerTemplate";

/**
 * Email Sending Utilities
 * Reusable functions for sending different types of emails
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromMailType?: 'sales' | 'support';
}

/**
 * Send generic email
 */
export const sendEmail = async (options: SendEmailOptions) => {
  const mailOptions = {
    from: options.from || `"Sappey Support" <${config.email.smtpHost}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]+>/g, '') // Fallback text by stripping HTML tags
  };

  try {
    const result = await emailTransporter(options.fromMailType || 'support').sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}:`, error);
    throw error;
  }
};

/**
 * Send OTP verification email
 */
export const sendOtpToEmail = async (email: string, code: string) => {
  return sendEmail({
    to: email,
    subject: "Your Sappey Verification Code",
    html: verificationOtpTemplate(code), // Use the new TypeScript template
    fromMailType: 'support'
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
  return sendEmail({
    to: email,
    subject: "Reset Your Sappey Password",
    html: passwordResetTemplate(resetLink), // Use the new TypeScript template
    fromMailType: 'support'
  });
};

/**
 * Send welcome email after successful registration
 */
export const sendWelcomeEmail = async (email: string, name: string) => {
  return sendEmail({
    to: email,
    subject: "Welcome to Sappey! Registration Received",
    html: sellerWelcomeTemplate(email, name), // Use the new TypeScript template
    fromMailType: 'support'
  });
};

export const sendSellerApprovalEmail = async (email: string, name: string) => {
  return sendEmail({
    to: email,
    subject: 'Sappey Seller Account Approved',
    html: sellerApprovalTemplate(name, `${process.env.FRONTEND_URL || 'https://local.host'}/login`), // Use the new TypeScript template
    fromMailType: 'support'
  });
};

export const sendSellerRejectionEmail = async (email: string, name: string, reason: string) => {
  return sendEmail({
    to: email,
    subject: 'Sappey Seller Account Rejected',
    html: sellerRejectionTemplate(name, reason, `${process.env.FRONTEND_URL || 'https://local.host'}/signup`), // Use the new TypeScript template
    fromMailType: 'support'
  });
};

export const sendSellerReapplyConfirmationEmail = async (email: string, name: string) => {
  return sendEmail({
    to: email,
    subject: 'Sappey Seller Reapplication Received',
    html: reapplyConfirmationTemplate(name), // Use the new TypeScript template
    fromMailType: 'support'
  });
};
