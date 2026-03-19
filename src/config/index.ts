import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendOrigin: process.env.FRONTEND_ORIGINS ? JSON.parse(process.env.FRONTEND_ORIGINS) : ["http://localhost:5173", "http://localhost:5174"],
  jwt: {
    secret: process.env.JWT_SECRET ?? "change_me",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  },
  session: {
    secret: process.env.SESSION_SECRET ?? "change_me",
    cookieName: process.env.SESSION_COOKIE_NAME ?? "sappay_session",
  },
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  email: {
    smtpHost: process.env.SMTP_HOST ?? "",
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpPassword: process.env.SMTP_PASSWORD ?? "",
  },
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.CLOUDFLARE_BUCKET ?? "",
    endpoint: process.env.CLOUDFLARE_ENDPOINT ?? "",
  },
};
