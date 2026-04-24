import { Request, Response } from 'express';
import { generateBarcodeDataUrl, generateQrCodeDataUrl } from './service';

export const generateQrCodeHandler = async (req: Request, res: Response) => {
  const { value } = req.body;

  if (!value || typeof value !== 'string') {
    return res.status(400).json({ error: 'Value is required for QR code generation.' });
  }

  try {
    const dataUrl = await generateQrCodeDataUrl(value);
    return res.json({ dataUrl });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message || 'Failed to generate QR code.' });
  }
};

export const generateBarcodeHandler = async (req: Request, res: Response) => {
  const { value, width, height } = req.body;

  if (!value || typeof value !== 'string') {
    return res.status(400).json({ error: 'Value is required for barcode generation.' });
  }

  try {
    const dataUrl = generateBarcodeDataUrl(value, Number(height) || 80, Number(width) || 2);
    return res.json({ dataUrl });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message || 'Failed to generate barcode.' });
  }
};
