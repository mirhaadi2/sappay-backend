import { Router } from 'express';
import { uploadImageHandler, refreshImageUrlHandler } from './controller';
import { upload } from './multer';

const router = Router();

router.post('/', upload.single('file'), uploadImageHandler);
router.get('/refresh', refreshImageUrlHandler);

export default router;
