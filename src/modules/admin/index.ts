/**
 * Main Admin Routes
 * Mounts all admin module sub-routers
 */

import { Router } from 'express';
import { requireAuth, requireActiveStaff } from './middleware';
import { adminRouter } from './routes';
import { adminCrudRouter } from './admin.routes';
import customerRoutes from './customers/routes';
import sellerRoutes from './sellers/routes';
import orderRoutes from './orders/routes';
import productRoutes from './products/routes';
import statsRoutes from './stats/routes';
import dashboardRoutes from './dashboard/routes';
import toolsRoutes from './tools/routes';
import { websiteAdminRoutes } from './website';
import { adminBulkOrdersRoutes } from './bulk-orders/routes';

const mainAdminRouter = Router();

// Apply authentication to all admin routes
mainAdminRouter.use(requireAuth, requireActiveStaff);

// Mount sub-routers
mainAdminRouter.use('/roles', adminRouter);
mainAdminRouter.use('/admins', adminCrudRouter);
mainAdminRouter.use(adminRouter); // Role management endpoints
mainAdminRouter.use('/customers', customerRoutes);
mainAdminRouter.use('/sellers', sellerRoutes);
mainAdminRouter.use('/orders', orderRoutes);
mainAdminRouter.use('/products', productRoutes);
mainAdminRouter.use('/bulk-orders', adminBulkOrdersRoutes);
mainAdminRouter.use('/stats', statsRoutes);
mainAdminRouter.use('/website', websiteAdminRoutes);
mainAdminRouter.use('/dashboard', dashboardRoutes);
mainAdminRouter.use('/tools', toolsRoutes);

export default mainAdminRouter;
