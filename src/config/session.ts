import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { config } from './index';
import { portalConfigs, Portal } from './portal-config';
import { redisClient } from '../infrastructure/redis';

// Initialize Redis store
const redisStore = new RedisStore({
    client: redisClient,
});

// Factory to create session options for each portal
export function getSessionOptionsForPortal(portal: Portal): session.SessionOptions {
    const portalConfig = portalConfigs[portal];
    const isProduction = config.nodeEnv === 'production';

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
            sameSite: isProduction ? 'none' : 'lax', // Change "strict" to "none" for cross-site Vercel setup
        },
        store: redisStore,
    };
}
