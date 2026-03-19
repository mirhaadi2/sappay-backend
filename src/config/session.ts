import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import { config } from "./index";

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

// Session config with Secure HttpOnly Cookies + Redis store
export const sessionOptions: session.SessionOptions = {
  name: config.session.cookieName,
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === "production", // HTTPS only in production
    httpOnly: true, // No JavaScript access to cookies
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: "strict", // CSRF protection
  },
  store: redisStore,
};
