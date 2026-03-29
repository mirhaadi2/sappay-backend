/**
 * Seller Authentication Controller
 * Handles seller login, registration, and profile endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../utils/AppError';
import { registerSellerService, loginSellerService, getSellerProfileService, initiateSellerRegistration, completeSellerRegistration } from './service';
import { SellerRegisterCredentials } from './types';
import { sendWelcomeEmail } from '../../../utils/sendEmail';
import { portalConfigs } from '../../../config/portal-config';

export const initiateRegistrationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, ownerName } = req.body;

    if (!email || !ownerName) {
      throw new AppError('BadRequest', 400, 'Email and owner name are required');
    }

    const result = await initiateSellerRegistration(email, ownerName);

    res.json({
      success: true,
      message: result.message,
      data: {
        email: result.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtpHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, registrationData } = req.body;

    if (!email || !otp || !registrationData) {
      throw new AppError('BadRequest', 400, 'Email, OTP, and registration data are required');
    }

    const seller = await completeSellerRegistration(email, otp, registrationData);

    res.status(201).json({
      success: true,
      message: seller.message,
      data: {
        seller: {
          id: seller.id,
          ownerEmail: seller.ownerEmail,
          ownerName: seller.ownerName,
          businessName: seller.businessName,
          status: seller.status,
        }
      },
    });
    
    sendWelcomeEmail(seller.ownerEmail, seller.ownerName).catch((error) => {
      console.error('Failed to send welcome email to', seller.ownerEmail, ':', error);
      // Email failure is non-critical, logged but not reported to client
    });
  } catch (error) {
    next(error);
  }
};

export const registerSellerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: SellerRegisterCredentials = req.body;

    // Validate required fields
    const requiredFields = [
      'password', 'businessName', 'businessRegistrationNo', 'businessType',
      'businessAddress', 'businessPhone', 'ownerName', 'ownerEmail',
      'bankAccountName', 'bankAccountNumber', 'bankIfscCode', 'businessIdType'
    ];

    for (const field of requiredFields) {
      if (!data[field as keyof SellerRegisterCredentials]) {
        throw new AppError('BadRequest', 400, `Missing required field: ${field}`);
      }
    }

    const seller = await registerSellerService(data);

    res.status(201).json({
      success: true,
      message: 'Seller registered successfully. Please wait for admin approval.',
      data: { seller: {
        id: seller.id,
        ownerEmail: seller.ownerEmail,
        ownerName: seller.ownerName,
        businessName: seller.businessName,
        status: seller.status,
      }}
    });
  } catch (error) {
    next(error);
  }
};

export const loginSellerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('BadRequest', 400, 'Email and password are required');
    }

    const result = await loginSellerService(email, password);

    // Store seller in session with all required properties
    (req.session as any).sellerId = result.seller.id;
    (req.session as any).userType = 'SELLER';
    (req.session as any).sellerStatus = result.seller.status;
    
    // Also maintain standard user structure
    req.session.user = {
      id: result.seller.id,
      email: result.seller.ownerEmail,
      role: 'SELLER' as any,
    };

    // Explicitly save session to Redis before sending response
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return next(new AppError('InternalError', 500, 'Failed to save session'));
      }

      res.json({
        success: true,
        data: {
          seller: {
            id: result.seller.id,
            ownerEmail: result.seller.ownerEmail,
            ownerName: result.seller.ownerName,
            businessName: result.seller.businessName,
            status: result.seller.status,
          }
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

export const logoutSellerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Destroy session completely and save
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return next(new AppError('InternalError', 500, 'Failed to logout'));
      }

      res.clearCookie(portalConfigs.SELLER.cookieName);
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  } catch (error) {
    next(error);
  }
};