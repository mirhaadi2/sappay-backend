import { Router } from 'express';
import { AppError } from '../../../utils/AppError';
import { FarmerInventory } from './model';

const router = Router();

router.get('/', async (req, res, next) => {
    try {
        const farmerId = (req.session as any)?.farmerId;
        if (!farmerId) throw new AppError('Unauthorized', 401, 'Authentication required');

        const inventory = await FarmerInventory.findAll({
            where: { farmerId },
            order: [['createdAt', 'DESC']],
        });
        res.json({ success: true, data: { inventory } });
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const farmerId = (req.session as any)?.farmerId;
        if (!farmerId) throw new AppError('Unauthorized', 401, 'Authentication required');

        const item = await FarmerInventory.create({
            farmerId,
            productId: req.body.productId,
            quantity: req.body.quantity,
            unit: req.body.unit,
            batchNumber: req.body.batchNumber,
            expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
        });

        res.status(201).json({ success: true, data: { item } });
    } catch (error) {
        next(error);
    }
});

export { router as farmerInventoryRoutes };
