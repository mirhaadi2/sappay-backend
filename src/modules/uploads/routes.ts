import { Router } from 'express';
import { uploadImageHandler } from './controller';
import { upload } from './multer';

const router = Router();

router.post('/', upload.single('file'), uploadImageHandler);

export default router;
