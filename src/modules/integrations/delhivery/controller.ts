import { Request, Response, NextFunction } from 'express';
import { checkPincodeServiceability, createShipment, trackShipmentService } from './services';
import { AppError } from '../../../utils/AppError';

/**
 * Handler for GET /api/pincode/:pincode
 */
export const checkPincode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pincode } = req.params;

    // Simple validation
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      res.status(400).json({
        success: false,
        message: 'Invalid pincode. Must be a 6-digit number.',
      });
      return;
    }

    const data = await checkPincodeServiceability(pincode);

    // Delhivery usually returns an object with a delivery_codes array
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    // Pass to your global error handler
    next(error);
  }
};

export const trackShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { waybill } = req.params;
    if (!waybill) {
      throw new AppError('ValidationErrror', 400, 'Waybill number is required');
    }
    
    const trackingData = await trackShipmentService(waybill);
    res.status(200).json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    next(error);
  } 
};
