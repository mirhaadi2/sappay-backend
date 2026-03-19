import { Request, Response, NextFunction } from 'express';
import {
  registerSeller,
  getSellerProfile,
  updateProfile,
  getDashboardStats,
  listSellers,
  approveSeller,
  rejectSeller,
  suspendSeller,  loginSeller,
  getCurrentSellerProfile,} from './service';
import { AppError } from '../../utils/AppError';
import { hashPassword } from '../../utils/password';
import { sendWelcomeEmail } from '../../utils/sendEmail';
import { findById } from './repository';

export const registerSellerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      password,
      businessName,
      businessRegistrationNo,
      businessType,
      businessIdType,
      gstNumber,
      businessAddress,
      businessPhone,
      ownerName,
      ownerEmail,
      bankAccountName,
      bankAccountNumber,
      bankIfscCode,
    } = req.body;

    // Validate required fields
    if (
      !password ||
      !businessName ||
      !businessRegistrationNo ||
      !businessType ||
      !businessAddress ||
      !businessPhone ||
      !ownerName ||
      !ownerEmail ||
      !bankAccountName ||
      !bankAccountNumber ||
      !bankIfscCode ||
      !businessIdType
    ) {
      throw new AppError('BadRequest', 400, 'Missing required fields');
    }

    // Hash password using bcrypt (same security as user passwords)
    const hashedPassword = await hashPassword(password);

    const result = await registerSeller({
      password: hashedPassword,
      businessName,
      businessRegistrationNo,
      businessType,
      businessIdType,
      gstNumber,
      businessAddress,
      businessPhone,
      ownerName,
      ownerEmail,
      bankAccountName,
      bankAccountNumber,
      bankIfscCode,
    });

    // Send response immediately (don't wait for email)
    res.status(201).json({ success: true, data: result });

    // Send welcome email asynchronously in the background (fire and forget)
    // This runs after response is sent, so it won't block the client
    sendWelcomeEmail(ownerEmail, ownerName).catch((error) => {
      console.error('Failed to send welcome email to', ownerEmail, ':', error);
      // Email failure is non-critical, logged but not reported to client
    });
  } catch (error) {
    next(error);
  }
};

export const sellerProfileHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }
    const seller = await findById(userId);
    if (!seller) {
      throw new AppError('NotFound', 404, 'Seller profile not found'); 
    }

    const profile = await getSellerProfile(seller.id);
    res.json({ success: true, data: profile });
  }
  catch (error) {
    next(error);
  }
};

export const getProfileHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const profile = await getSellerProfile(id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfileHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.session?.user?.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    const updated = await updateProfile(id, userId, req.body);
    res.json({ success: true, data: updated, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getDashboardHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.session?.user?.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    const stats = await getDashboardStats(id);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const listSellersHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, limit, offset, sortBy } = req.query;
    const result = await listSellers({
      status: status as string,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
      sortBy: sortBy as string,
    });

    res.json({
      success: true,
      data: result.rows,
      pagination: { total: result.count, limit, offset },
    });
  } catch (error) {
    next(error);
  }
};

export const approveSellerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await approveSeller(id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const rejectSellerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new AppError('BadRequest', 400, 'Rejection reason is required');
    }

    const result = await rejectSeller(id, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const suspendSellerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new AppError('BadRequest', 400, 'Suspension reason is required');
    }

    const result = await suspendSeller(id, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Seller Login Handler
 * Authenticates seller by email and password
 * Returns JWT tokens and seller profile
 */
export const loginSellerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('BadRequest', 400, 'Email and password are required');
    }

    const result = await loginSeller(email, password);

    // Store user in session (Redis-backed, HttpOnly cookie sent automatically)
    req.session.user = {
      id: result.seller.id,
      email: result.seller.ownerEmail,
      role: 'SELLER' as any,
    };

    res.json({
      success: true,
      data: {
        seller: result.seller,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Seller Me Handler (Get Current Seller Profile)
 * Returns complete profile of authenticated seller
 * Requires valid JWT token with SELLER role
 */
export const getSellerMeHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = (req as any).user?.id;

    if (!sellerId) {
      throw new AppError('Unauthorized', 401, 'Please authenticate first');
    }

    const profile = await getCurrentSellerProfile(sellerId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Seller Logout Handler
 * Destroys session and clears sensitive data
 */
export const logoutSellerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid'); // Default session cookie name
      res.json({ success: true, message: 'Logged out successfully' });
    });
  } catch (error) {
    next(error);
  }
};
