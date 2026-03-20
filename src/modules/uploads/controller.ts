import { Request, Response, NextFunction } from 'express';
import { uploadToR2 } from './r2-utils';
import { Multer } from 'multer';
import { config } from '../../config';

export const uploadImageHandler = async (req: Request & { file?: Express.Multer.File }, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
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
