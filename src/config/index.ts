import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendOrigin: process.env.FRONTEND_ORIGINS
    ? JSON.parse(process.env.FRONTEND_ORIGINS)
    : [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
      ],
  jwt: {
    secret: process.env.JWT_SECRET ?? "change_me",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  },
  session: {
    secret: process.env.SESSION_SECRET ?? "change_me",
    cookieName: process.env.SESSION_COOKIE_NAME ?? "sappey_session",
  },
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  email: {
    smtpHost: process.env.SMTP_HOST ?? "",
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpUser: process.env.SMTP_USER ?? "",
    smtpPassword: process.env.SMTP_PASSWORD ?? "",
    smtpSecure: (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true",
    fromEmail: process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER ?? "",
    salesTeamEmail:
      process.env.SALES_TEAM_EMAIL ??
      process.env.SMTP_FROM_EMAIL ??
      process.env.SMTP_USER ??
      "",
    salesTeamPassword: process.env.SALES_TEAM_PASSWORD ?? "",
  },
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.CLOUDFLARE_BUCKET ?? "",
    endpoint: process.env.CLOUDFLARE_ENDPOINT ?? "",
    publicUrl: process.env.CLOUDFLARE_PUBLIC_URL ?? "",
  },
  aws: {
    region: process.env.AWS_REGION ?? "ap-south-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    smsEntityId: process.env.AWS_SMS_ENTITY_ID ?? "",
    smsOriginationId: process.env.AWS_SMS_ORIGINATION_ID ?? "",
    snsEmailTopicArn: process.env.AWS_SNS_EMAIL_TOPIC_ARN ?? "",
  },
  whatsapp: {
    baseUrl:
      process.env.WHATSAPP_BASE_URL ?? "https://graph.facebook.com/v18.0",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    token: process.env.WHATSAPP_TOKEN ?? "",
  },
  delhivery: {
    token: process.env.DELHIVERY_TOKEN ?? "",
    baseUrl:
      process.env.NODE_ENV === "production"
        ? (process.env.PRODUCTION_DELHIVERY_BASE_URL ??
          "https://track.delhivery.com")
        : (process.env.TESTING_DELHIVERY_BASE_URL ??
          "https://staging-express.delhivery.com"),
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER?.toLowerCase() ?? "none",
    apiKey: process.env.PAYMENT_API_KEY ?? "",
    apiSecret: process.env.PAYMENT_API_SECRET ?? "",
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? "",
  },
  // ⚠️ IMPORTANT: Only ONE notification channel can be active at a time
  notificationChannel: (
    process.env.NOTIFICATION_CHANNEL ?? "sms"
  ).toLowerCase() as "sms" | "email" | "whatsapp" | "in_app",
};
