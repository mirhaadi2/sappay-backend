import { Router } from 'express';
import { AppError } from '../../utils/AppError';
import { getFarmerProfileService, updateFarmerProfileService } from './service';

const router = Router();

router.get('/me', async (req, res, next) => {
    try {
        const farmerId = (req.session as any)?.farmerId;
        if (!farmerId) {
            throw new AppError('Unauthorized', 401, 'Authentication required');
        }

        const farmer = await getFarmerProfileService(farmerId);

        res.json({ success: true, data: { farmer } });
    } catch (error) {
        next(error);
    }
});

router.put('/me', async (req, res, next) => {
    try {
        const farmerId = (req.session as any)?.farmerId;
        if (!farmerId) {
            throw new AppError('Unauthorized', 401, 'Authentication required');
        }

        const farmer = await updateFarmerProfileService(farmerId, req.body);

        res.json({ success: true, data: { farmer } });
    } catch (error) {
        next(error);
    }
});

export { router as farmersRoutes };
