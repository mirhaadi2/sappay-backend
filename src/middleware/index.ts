// Main middleware exports
export { requireAuth, requireActiveStaff, requirePermission, AuthenticatedRequest } from '../modules/admin/middleware';
export { errorHandler } from './error.middleware';