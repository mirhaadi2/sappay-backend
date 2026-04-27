import { Router } from 'express';
import { checkPincode } from './controller';

const router = Router();

/**
 * @route GET /api/delhivery/pincode/:pincode
 * @desc Check if a pincode is serviceable by Delhivery
 * @access Public
 */
router.get('/pincode/:pincode', checkPincode);

// Add more routes here as needed

export { router as delhiveryRoutes };