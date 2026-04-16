import nodemailer from "nodemailer";
import { config } from "../config/index";

/**
 * Email Transporter Configuration
 * Centralized setup for sending emails via Gmail SMTP
 */

export const emailTransporter = nodemailer.createTransport({
  host: config.email.smtpHost,
  port: config.email.smtpPort,
  secure: config.email.smtpPort === 465,
  auth: {
    user: config.email.smtpUser,      // Gmail address
    pass: config.email.smtpPassword,  // Gmail App Password
  },
});

// Verify transporter connection on startup
emailTransporter.verify((error: Error | null, success: boolean) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
  } else {
    console.log("✅ Email transporter ready");
  }
});

export default emailTransporter;
