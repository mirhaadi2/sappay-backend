import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import {
    portalSessionMiddleware,
    portalSessionPaths,
} from './middleware/portal-session.middleware';
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

app.set('trust proxy', 1);
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
app.use(portalSessionPaths, portalSessionMiddleware);

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
