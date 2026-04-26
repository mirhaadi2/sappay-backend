import { NextFunction, Request, Response } from 'express';
import { generateBarcodeDataUrl, generateQrCodeDataUrl } from './service';
import { AppError } from '../../../utils/AppError';

export const generateQrCodeHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { value } = req.body;

  if (!value || typeof value !== 'string') {
    throw new AppError('ValidationError', 400, 'Value is required for QR code generation.');
  }

  try {
    const dataUrl = await generateQrCodeDataUrl(value);
    return res.json({ dataUrl });
  } catch (error) {
    next(error);
  }
};

export const generateBarcodeHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { value, width, height } = req.body;

  if (!value || typeof value !== 'string') {
    throw new AppError('ValidationError', 400, 'Value is required for barcode generation.');
  }

  try {
    const dataUrl = generateBarcodeDataUrl(value, Number(height) || 80, Number(width) || 2);
    return res.json({ dataUrl });
  } catch (error) {
    next(error);
  }
};
