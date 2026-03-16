import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import { config } from "./index";

// Create Redis client
const redisClient = createClient({
  url: config.redisUrl,
});

let redisStore: RedisStore | undefined;

redisClient.connect().then(() => {
  console.log("✅ Connected to Redis - sessions will be stored in Redis");
  redisStore = new RedisStore({
    client: redisClient,
  });
}).catch((err) => {
  console.error("❌ Failed to connect to Redis - using memory store for sessions:", err.message);
  redisStore = undefined;
});

// Export session options - will use memory store initially, switch to Redis when connected
export const sessionOptions: session.SessionOptions = {
  name: config.session.cookieName,
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: "strict",
  },
  store: redisStore, // Will be undefined initially, using memory store
};
