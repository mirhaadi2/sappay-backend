import { Request, Response, NextFunction } from 'express';
import { checkPincodeServiceability, createShipment } from './services';

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

/**
 * Example: Additional handler for creating a shipment
 */
export const handleCreateShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await createShipment(req.body);
    res.status(201).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};