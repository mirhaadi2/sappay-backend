import { Router } from 'express';
import { AppError } from '../../../utils/AppError';
import { FarmerSale } from './model';

const router = Router();

router.get('/', async (req, res, next) => {
    try {
        const farmerId = (req.session as any)?.farmerId;
        if (!farmerId) throw new AppError('Unauthorized', 401, 'Authentication required');

        const sales = await FarmerSale.findAll({ where: { farmerId }, order: [['soldAt', 'DESC']] });
        res.json({ success: true, data: { sales } });
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const farmerId = (req.session as any)?.farmerId;
        if (!farmerId) throw new AppError('Unauthorized', 401, 'Authentication required');

        const sale = await FarmerSale.create({
            farmerId,
            productId: req.body.productId,
            quantity: req.body.quantity,
            unitPrice: req.body.unitPrice,
            totalAmount: req.body.totalAmount,
            soldAt: req.body.soldAt ? new Date(req.body.soldAt) : new Date(),
        });

        res.status(201).json({ success: true, data: { sale } });
    } catch (error) {
        next(error);
    }
});

export default router;
