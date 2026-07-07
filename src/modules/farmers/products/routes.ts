import { Router } from 'express';
import { AppError } from '../../../utils/AppError';
import { withTransaction } from '../../../utils/transaction';
import { FarmerProduct } from './model';

const router = Router();

router.get('/', async (req, res, next) => {
    try {
        const farmerId = (req.session as any)?.farmerId;
        if (!farmerId) throw new AppError('Unauthorized', 401, 'Authentication required');

        const products = await FarmerProduct.findAll({ where: { farmerId, isActive: true }, order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: { products } });
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const farmerId = (req.session as any)?.farmerId;
        if (!farmerId) throw new AppError('Unauthorized', 401, 'Authentication required');

        const product = await withTransaction(async (transaction) => {
            return FarmerProduct.create({
                farmerId,
                name: req.body.name,
                category: req.body.category,
                unit: req.body.unit,
                pricePerUnit: req.body.pricePerUnit,
                description: req.body.description,
                isActive: true,
            }, { transaction });
        });

        res.status(201).json({ success: true, data: { product } });
    } catch (error) {
        next(error);
    }
});

export default router;
