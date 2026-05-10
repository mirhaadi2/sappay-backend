import { Request, Response, NextFunction } from 'express';
import { uploadToR2, resolveR2Url } from './r2-utils';
import { Multer } from 'multer';
import { config } from '../../config';
import { AppError } from '../../utils/AppError';

export const uploadImageHandler = async (req: Request & { file?: Express.Multer.File }, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('ValidationError', 400, 'No file uploaded');
    }
    const folder = req.body.folder || req.query.folder || 'misc';
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const r2Key = `${folder}/${Date.now()}-${fileName}`;
    await uploadToR2(fileBuffer, r2Key, req.file.mimetype);
    res.status(201).json({
      success: true,
      url: r2Key,
      key: r2Key,
      originalName: fileName,
      contentType: req.file.mimetype,
      folder,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshImageUrlHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = (req.query.key || req.body?.key) as string;
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      throw new AppError('ValidationError', 400, 'Image key is required');
    }

    const url = await resolveR2Url(key);
    if (!url) {
      throw new AppError('NotFound', 404, 'Unable to generate a fresh image URL for the given key');
    }

    res.json({ success: true, key: key.trim(), url });
  } catch (error) {
    next(error);
  }
};
