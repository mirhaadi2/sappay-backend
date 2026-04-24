import { Router } from 'express';
import { requirePermission } from '../middleware';
import { generateBarcodeHandler, generateQrCodeHandler } from './controller';

const toolsRouter = Router();

/**
 * POST /admin/tools/qrcode
 * Generate a QR code data URL for the provided value.
 */
toolsRouter.post('/qrcode', requirePermission('admin.dashboard.read'), generateQrCodeHandler);

/**
 * POST /admin/tools/barcode
 * Generate a barcode SVG data URL for the provided value.
 */
toolsRouter.post('/barcode', requirePermission('admin.dashboard.read'), generateBarcodeHandler);

export default toolsRouter;
