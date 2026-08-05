import nodemailer from "nodemailer";
import { config } from "../config/index";

console.log({
  host: config.email.smtpHost,
  port: config.email.smtpPort,
  secure: config.email.smtpSecure,
});

// 1. Pre-initialize the transporters
const transporters = {
  sales: nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpSecure,
    logger: true,
    debug: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: config.email.salesTeamEmail,
      pass: config.email.salesTeamPassword,
    },
  }),

  support: nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpSecure,
    logger: true,
    debug: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: config.email.smtpUser,
      pass: config.email.smtpPassword,
    },
  }),
};

type EmailAccountType = keyof typeof transporters;

// 2. Export a simple getter function
export const emailTransporter = (type: EmailAccountType) => {
  return transporters[type];
};

// 3. Verify all transporters on startup
Object.entries(transporters).forEach(([name, transporter]) => {
  transporter.verify((error) => {
    if (error) console.error(`❌ ${name} email failed:`, error);
    else console.log(`✅ ${name} email ready`);
  });
});
