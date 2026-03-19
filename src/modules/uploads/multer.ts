import multer from 'multer';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 10;

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
	if (!allowedMimeTypes.includes(file.mimetype)) {
		// Multer expects first arg to be null or an instance of MulterError
		return cb(null, false);
	}
	cb(null, true);
};

export const upload = multer({
	storage: multer.memoryStorage(),
	fileFilter,
	limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});
