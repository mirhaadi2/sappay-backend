import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { getSessionOptionsForPortal } from './config/session';
import { Portal, getPortalFromPath } from './config/portal-config';
import { websiteAuthRoutes } from './modules/website/auth/routes';
import { customerRoutes } from './modules/website/customers/routes';
import { addressRoutes } from './modules/website/address/routes';
import { productRoutes } from './modules/website/products/routes';
import { homepageRoutes } from './modules/website/homepage';
import { promotionsRoutes } from './modules/website/promotions';
import { couponsRoutes } from './modules/website/coupons/routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLoggingMiddleware, errorLoggingMiddleware } from './middleware/logging.middleware';
import { sellerRoutes } from './modules/sellers';
import { uploadsRoutes } from './modules/uploads';
import { adminAuthRoutes } from './modules/admin/auth/routes';
import { adminRoutes } from './modules/admin';
import { staffAuthRoutes } from './modules/staff/auth/routes';
import { staffRouter } from './modules/staff/routes';
import { orderRoutes } from './modules/website/orders';
import { notificationRoutes } from './modules/notifications';
import { guestRoutes } from './modules/website/guest';
import { bulkOrderRoutes } from './modules/website/bulk-orders/routes';
import { reviewRoutes } from './modules/website/reviews/routes';
import { delhiveryRoutes } from './integrations/delhivery/routes';
import { delhiveryAdminRoutes } from './modules/admin/integrations/delhivery/routes';
import { farmersAuthRoutes } from './modules/farmers/auth/routes';
import { farmersRoutes } from './modules/farmers/routes';
import { farmerProductsRoutes } from './modules/farmers/products/routes';
import { farmerInventoryRoutes } from './modules/farmers/inventory/routes';
import { farmerSalesRoutes } from './modules/farmers/sales/routes';

const app = express();

app.set('trust proxy', 1); // Trust first proxy for development/production

// Add request logging middleware as the first middleware
app.use(requestLoggingMiddleware);

app.use(helmet());
app.use(
    cors({
        origin: config.frontendOrigin,
        credentials: true,
    }),
);
app.use(cookieParser(config.session.secret));
app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Create session middleware instances for each portal upfront (not per-request)
const websiteSession = session(getSessionOptionsForPortal(Portal.WEBSITE));
const sellerSession = session(getSessionOptionsForPortal(Portal.SELLER));
const adminSession = session(getSessionOptionsForPortal(Portal.ADMIN));

// Universal session middleware for all portals
app.use(
    [
        '/api/auth',
        '/api/customers',
        '/api/addresses',
        '/api/products',
        '/api/sellers',
        '/api/farmers',
        '/api/admin',
        '/api/staff',
        '/api/orders',
        '/api/notifications',
        '/api/bulk-orders',
        '/api/reviews',
        '/api/delhivery',
    ],
    (req, res, next) => {
        // Determine the effective path to support mounted routers (req.path may be stripped)
        const effectivePath = (req.originalUrl || req.baseUrl || req.path || '').toString();
        const cookieHeader =
            typeof req.headers.cookie === 'string'
                ? req.headers.cookie
                : req.cookies && typeof req.cookies === 'object'
                  ? Object.keys(req.cookies).join('; ')
                  : '';

        const portal = getPortalFromPath(effectivePath, cookieHeader);

        // Use the appropriate session middleware instance
        const sessionMiddleware =
            portal === Portal.SELLER
                ? sellerSession
                : portal === Portal.ADMIN
                  ? adminSession
                  : websiteSession;

        return sessionMiddleware(req, res, next);
    },
);

app.use('/api/auth', websiteAuthRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/products', productRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/website/promotions', promotionsRoutes);
app.use('/api/website/coupons', couponsRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/bulk-orders', bulkOrderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/farmers/auth', farmersAuthRoutes);
app.use('/api/farmers', farmersRoutes);
app.use('/api/farmers/products', farmerProductsRoutes);
app.use('/api/farmers/inventory', farmerInventoryRoutes);
app.use('/api/farmers/sales', farmerSalesRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff/auth', staffAuthRoutes);
app.use('/api/staff', staffRouter);
app.use('/api/delhivery', delhiveryRoutes);
app.use('/api/admin/delhivery', delhiveryAdminRoutes);

app.use(errorLoggingMiddleware);
app.use(errorHandler);

export default app;
