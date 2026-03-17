import nodemailer from "nodemailer";
import { config } from "../config/index";

/**
 * Email Transporter Configuration
 * Centralized setup for sending emails via Gmail SMTP
 */

export const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.email.smtpHost,      // Gmail address
    pass: config.email.smtpPassword,  // Gmail App Password
  },
});

// Verify transporter connection on startup
emailTransporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
  } else {
    console.log("✅ Email transporter ready");
  }
});

export default emailTransporter;
