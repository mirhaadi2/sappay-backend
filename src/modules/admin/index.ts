/**
 * Main Admin Routes
 * Mounts all admin module sub-routers
 */

import { Router } from 'express';
import { requireAuth, requireActiveStaff } from './middleware';
import { adminRouter } from './routes';
import { adminCrudRouter } from './admin.routes';
import userRoutes from './users/routes';
import sellerRoutes from './sellers/routes';
import orderRoutes from './orders/routes';
import productRoutes from './products/routes';
import statsRoutes from './stats/routes';

const mainAdminRouter = Router();

// Apply authentication to all admin routes
mainAdminRouter.use(requireAuth, requireActiveStaff);

// Mount sub-routers
mainAdminRouter.use('/roles', adminRouter);
mainAdminRouter.use('/admins', adminCrudRouter);
mainAdminRouter.use(adminRouter); // Role management endpoints
mainAdminRouter.use('/users', userRoutes);
mainAdminRouter.use('/sellers', sellerRoutes);
mainAdminRouter.use('/orders', orderRoutes);
mainAdminRouter.use('/products', productRoutes);
mainAdminRouter.use('/stats', statsRoutes);

export default mainAdminRouter;
