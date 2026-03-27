import { emailTransporter } from "./emailTransporter";
import { config } from "../config/index";

/**
 * Email Sending Utilities
 * Reusable functions for sending different types of emails
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
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
  };

  try {
    const result = await emailTransporter.sendMail(mailOptions);
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
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #4b3832;">Verify your account</h2>
        <p>Your OTP for Sappey registration is:</p>
        <h1 style="letter-spacing: 5px; color: #4b3832; text-align: center;">${code}</h1>
        <p style="color: #666;">This code expires in 5 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
  return sendEmail({
    to: email,
    subject: "Reset Your Sappey Password",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #4b3832;">Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4b3832; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #666;">Or copy this link: <br/><code>${resetLink}</code></p>
        <p style="color: #666;">This link expires in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send welcome email after successful registration
 */
export const sendWelcomeEmail = async (email: string, name: string) => {
  return sendEmail({
    to: email,
    subject: "Welcome to Sappey! Registration Received",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #4b3832;">Welcome to Sappey, ${name}!</h2>
        <p>Thank you for registering as a Sappey seller. Your application has been received successfully.</p>
        <p>It will now be reviewed by our admin team. Once approved, you can log in and start using all features.</p>
        <p style="font-weight: 700; margin-top: 16px;">What happens next?</p>
        <ul style="padding-left: 16px; margin: 6px 0 16px 0; color: #555;">
          <li>Admin reviews your business and KYC details.</li>
          <li>Approval usually takes 24–72 hours.</li>
          <li>You will receive another email after verification.</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Questions? Contact us at support@sappey.com</p>
      </div>
    `,
  });
};

export const sendSellerApprovalEmail = async (email: string, name: string) => {
  console.log(email,name,'email,name')
  return sendEmail({
    to: email,
    subject: 'Sappey Seller Account Approved',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #4b3832;">Hello ${name},</h2>
        <p>Your seller account has been approved by the Sappey team.</p>
        <p>You can now log in and start using all seller features.</p>
        <a href="${process.env.FRONTEND_URL || 'https://local.host'}/login" style="display: inline-block; padding: 10px 20px; background-color: #4b3832; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Go to Login
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Questions? Contact us at support@sappey.com</p>
      </div>
    `,
  });
};

export const sendSellerRejectionEmail = async (email: string, name: string, reason: string) => {
  return sendEmail({
    to: email,
    subject: 'Sappey Seller Account Rejected',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #4b3832;">Hello ${name},</h2>
        <p>We reviewed your seller application and, unfortunately, it was not approved.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You can update your details and reapply at any time.</p>
        <a href="${process.env.FRONTEND_URL || 'https://local.host'}/signup" style="display: inline-block; padding: 10px 20px; background-color: #4b3832; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reapply Now
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Questions? Contact us at support@sappey.com</p>
      </div>
    `,
  });
};

export const sendSellerReapplyConfirmationEmail = async (email: string, name: string) => {
  return sendEmail({
    to: email,
    subject: 'Sappey Seller Reapplication Received',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #4b3832;">Hi ${name},</h2>
        <p>Your reapplication has been received and is now pending admin review.</p>
        <p>We will notify you once your application is approved or rejected.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Questions? Contact us at support@sappey.com</p>
      </div>
    `,
  });
};
