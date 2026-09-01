import { Request, Response, NextFunction } from 'express';
import { createShipment } from '../../../../integrations/delhivery/services';

export const handleCreateShipment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await createShipment(req.body);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
