import { Request, Response, NextFunction } from 'express';
import { r2Client } from './r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Multer } from 'multer';
import { config } from '../../config';

export const uploadImageHandler = async (req: Request & { file?: Express.Multer.File }, res: Response, next: NextFunction) => {
  try {
    // For demo: use multer or similar middleware for file upload
    // Here, assume req.file exists (multer setup required in app.ts)
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Dynamic folder for upload
    const folder = req.body.folder || req.query.folder || 'misc';
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const r2Key = `${folder}/${Date.now()}-${fileName}`;
    await r2Client.send(new PutObjectCommand({
      Bucket: config.cloudflare.bucket,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: req.file.mimetype,
    }));
    const fileUrl = r2Key;
    res.status(201).json({
      success: true,
      url: fileUrl,
      key: r2Key,
      originalName: fileName,
      contentType: req.file.mimetype,
      folder,
    });
  } catch (error) {
    next(error);
  }
};
