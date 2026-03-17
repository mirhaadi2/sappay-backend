import { Request, Response, NextFunction } from 'express';
import {
  registerSeller,
  getSellerProfile,
  updateProfile,
  getDashboardStats,
  listSellers,
  approveSeller,
  rejectSeller,
  suspendSeller,
} from './service';
import { AppError } from '../../utils/AppError';

export const registerSellerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    const {
      businessName,
      businessRegistrationNo,
      businessType,
      gstNumber,
      businessAddress,
      businessPhone,
      ownerName,
      ownerEmail,
      bankAccountName,
      bankAccountNumber,
      bankIfscCode,
    } = req.body;

    if (
      !businessName ||
      !businessRegistrationNo ||
      !businessType ||
      !businessAddress ||
      !businessPhone ||
      !ownerName ||
      !ownerEmail ||
      !bankAccountName ||
      !bankAccountNumber ||
      !bankIfscCode
    ) {
      throw new AppError('BadRequest', 400, 'Missing required fields');
    }

    const result = await registerSeller(userId, {
      businessName,
      businessRegistrationNo,
      businessType,
      gstNumber,
      businessAddress,
      businessPhone,
      ownerName,
      ownerEmail,
      bankAccountName,
      bankAccountNumber,
      bankIfscCode,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
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
