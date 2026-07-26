import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import { config } from "./index";
import { portalConfigs, Portal } from "./portal-config";

// Create Redis client with improved connection settings
const redisClient = createClient({
  url: config.redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("Max Redis reconnection attempts reached");
        return false; // Stop reconnecting
      }
      return retries * 50; // Retry with exponential backoff: 50ms, 100ms, 150ms...
    },
    connectTimeout: 10000, // 10 second timeout instead of default 5 seconds
  },
});

// Initialize Redis store
const redisStore = new RedisStore({
  client: redisClient,
});

// Connect to Redis
redisClient.connect()
  .then(() => {
    console.log("✅ Connected to Redis - sessions will be stored in Redis");
  })
  .catch((err) => {
    console.error("❌ Failed to connect to Redis:", err.message);
    console.log("⚠️  Application will start without Redis. Restart once Redis is available.");
    // Don't exit - let the app run with in-memory sessions temporarily
  });

// Handle Redis connection events
redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('ready', () => {
  console.log('✅ Redis ready to serve requests');
});

export { redisClient };

// Factory to create session options for each portal
export function getSessionOptionsForPortal(portal: Portal): session.SessionOptions {
  const portalConfig = portalConfigs[portal];
  const isProduction = config.nodeEnv === "production";
  
  return {
    name: portalConfig.cookieName,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Recommended since you are behind a cloud proxy/load balancer
    cookie: {
      secure: isProduction, // Must be true when using sameSite: "none"
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: isProduction ? "none" : "lax", // Change "strict" to "none" for cross-site Vercel setup
    },
    store: redisStore,
  };
}
