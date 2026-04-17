import { config } from "../../../../../config";
import logger from "../../../../../utils/logger";
import nodemailer from "nodemailer";

const smtpConfig = {
  host: config.email.smtpHost,
  port: config.email.smtpPort,
  user: config.email.smtpUser,
  password: config.email.smtpPassword,
  secure: config.email.smtpSecure,
  fromEmail: config.email.fromEmail,
};
console.log(smtpConfig, "smtp config");

if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.password) {
  logger.warn("SMTP not fully configured. Email notifications will not work.", {
    configured: {
      host: !!smtpConfig.host,
      user: !!smtpConfig.user,
      password: !!smtpConfig.password,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
    },
  });
}

const createTransporter = (): any => {
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.password,
    },
    tls: {
      // This is the "magic" line for VPS environments
      rejectUnauthorized: config.nodeEnv !== "development",
    },
    pool: true, // Use connection pooling
    maxConnections: 5,
    maxMessages: 100,
  });
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sendEmail = async (
  email: string,
  subject: string,
  htmlContent: string,
  textContent?: string,
): Promise<string | null> => {
  try {
    // Validate email format
    if (!validateEmail(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    // Validate SMTP configuration
    if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.password) {
      throw new Error(
        "SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env",
      );
    }

    const transporter = createTransporter();

    if (!transporter) {
      logger.warn(
        "[EMAIL] Nodemailer not installed. Queueing email for manual processing.",
        { email, subject },
      );
      // Queue for later processing or use alternative method
      return `email_queued_${Date.now()}`;
    }

    // Send email
    const info = await transporter.sendMail({
      from: smtpConfig.fromEmail || smtpConfig.user,
      to: email,
      subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ""), // Strip HTML tags as fallback
      replyTo: smtpConfig.fromEmail || smtpConfig.user,
    });

    logger.info("[EMAIL] Email sent successfully", {
      email,
      subject,
      messageId: info.messageId,
      response: info.response,
    });

    return info.messageId || `email_${Date.now()}`;
  } catch (error: any) {
    logger.error("[EMAIL] Failed to send email", {
      email,
      subject,
      error: error.message,
      code: error.code,
    });

    throw new Error(`Failed to send email to ${email}: ${error.message}`);
  }
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    if (!smtpConfig.host || !smtpConfig.user) {
      logger.warn("[EMAIL] Health check failed: SMTP not configured");
      return false;
    }

    const transporter = createTransporter();

    if (!transporter) {
      logger.warn("[EMAIL] Nodemailer not installed for health check");
      return false;
    }

    await transporter.verify();

    logger.info("[EMAIL] Health check passed: SMTP connection successful");
    return true;
  } catch (error: any) {
    logger.error("[EMAIL] Health check failed", {
      error: error.message,
      host: smtpConfig.host,
      port: smtpConfig.port,
    });
    return false;
  }
};

export const getStatus = (): {
  isConfigured: boolean;
  provider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  description: string;
} => {
  const isConfigured = !!(
    smtpConfig.host &&
    smtpConfig.user &&
    smtpConfig.password
  );
  const provider = smtpConfig.host?.includes("gmail") ? "Gmail" : "Custom SMTP";

  return {
    isConfigured,
    provider,
    smtpHost: smtpConfig.host || "Not configured",
    smtpPort: smtpConfig.port,
    smtpUser: smtpConfig.user
      ? `${smtpConfig.user.split("@")[0]}@...`
      : "Not configured",
    description: isConfigured
      ? `Email service enabled via ${provider} (${smtpConfig.host}:${smtpConfig.port})`
      : "Email service not configured - install nodemailer: npm install nodemailer",
  };
};

export const emailService = {
  sendEmail,
  healthCheck,
  getStatus,
};
