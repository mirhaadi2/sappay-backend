import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import { config } from "./index";
import { portalConfigs, Portal } from "./portal-config";

// Create Redis client
const redisClient = createClient({
  url: config.redisUrl,
});

// Initialize Redis store
const redisStore = new RedisStore({
  client: redisClient,
});

// Connect to Redis
redisClient.connect().then(() => {
  console.log("✅ Connected to Redis - sessions will be stored in Redis");
}).catch((err) => {
  console.error("❌ Failed to connect to Redis:", err.message);
  process.exit(1);
});


// Factory to create session options for each portal
export function getSessionOptionsForPortal(portal: Portal): session.SessionOptions {
  const portalConfig = portalConfigs[portal];
  return {
    name: portalConfig.cookieName,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: config.nodeEnv === "production" ? "strict" : "lax", // Use lax for development
    },
    store: redisStore,
  };
}
