import { Request, Response, NextFunction } from 'express';
import { uploadToCloudflareR2 } from '../../infrastructure/storage/cloudflare';
import { AppError } from '../../utils/AppError';

export const uploadImageHandler = async (
    req: Request & { file?: Express.Multer.File },
    res: Response,
    next: NextFunction,
) => {
    try {
        if (!req.file) {
            throw new AppError('ValidationError', 400, 'No file uploaded');
        }
        const folder = req.body.folder || req.query.folder || 'misc';
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        const r2Key = `${folder}/${Date.now()}-${fileName}`;
        await uploadToCloudflareR2(fileBuffer, r2Key, req.file.mimetype);
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
