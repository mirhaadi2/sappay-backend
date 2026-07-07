import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../utils/AppError';
import { registerFarmerService, loginFarmerService } from '../service';
import { FarmerRegisterInput, FarmerLoginInput } from '../types';
import { validateFarmerRegistration, validateFarmerLogin } from '../validation';

export const registerFarmerHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body as FarmerRegisterInput;
        validateFarmerRegistration(data);

        const farmer = await registerFarmerService(data);

        (req.session as any).farmerId = farmer.id;
        (req.session as any).userType = 'FARMER';
        (req.session as any).farmerStatus = farmer.status;
        req.session.user = {
            id: farmer.id,
            email: farmer.email || farmer.mobileNumber,
            role: 'FARMER' as any,
        };

        req.session.save((err) => {
            if (err) {
                return next(new AppError('InternalError', 500, 'Failed to save session'));
            }

            res.status(201).json({
                success: true,
                message: 'Farmer registered successfully',
                data: {
                    farmer: {
                        id: farmer.id,
                        fullName: farmer.fullName,
                        mobileNumber: farmer.mobileNumber,
                        village: farmer.village,
                        district: farmer.district,
                        status: farmer.status,
                    },
                },
            });
        });
    } catch (error) {
        next(error);
    }
};

export const loginFarmerHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body as FarmerLoginInput;
        validateFarmerLogin(data);

        const farmer = await loginFarmerService(data);

        (req.session as any).farmerId = farmer.id;
        (req.session as any).userType = 'FARMER';
        (req.session as any).farmerStatus = farmer.status;
        req.session.user = {
            id: farmer.id,
            email: farmer.email || farmer.mobileNumber,
            role: 'FARMER' as any,
        };

        req.session.save((err) => {
            if (err) {
                return next(new AppError('InternalError', 500, 'Failed to save session'));
            }

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    farmer: {
                        id: farmer.id,
                        fullName: farmer.fullName,
                        mobileNumber: farmer.mobileNumber,
                        village: farmer.village,
                        district: farmer.district,
                        status: farmer.status,
                    },
                },
            });
        });
    } catch (error) {
        next(error);
    }
};

export const logoutFarmerHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return next(new AppError('InternalError', 500, 'Failed to logout'));
            }

            res.clearCookie('sappey_farmer_sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    } catch (error) {
        next(error);
    }
};
