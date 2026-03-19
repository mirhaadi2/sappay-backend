import { Request, Response, NextFunction } from 'express';
import {
  createProductService,
  getProductDetailsService,
  fetchProductsService,
  getCategoriesService,
  createCategoryService,
  addProductToSellerService,
  getSellerProductsService,
  updateSellerProductPriceService,
} from './service';
import { findById } from '../sellers/repository';
import { AppError } from '../../utils/AppError';

export const createProductHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await createProductService(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const getProductDetailsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const product = await getProductDetailsService(id);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const fetchProductsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await fetchProductsService(req.query);
    console.log(result,'result');
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const createCategoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await createCategoryService(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const getCategoriesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getCategoriesService(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const addProductToSellerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const userId = req.session?.user?.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    const seller = await findById(userId);
    if (!seller) {
      throw new AppError('BadRequest', 400, 'You are not registered as a seller');
    }

    const result = await addProductToSellerService(seller.id, productId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getSellerProductsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    const seller = await findById(userId);
    if (!seller) {
      throw new AppError('BadRequest', 400, 'You are not registered as a seller');
    }

    const result = await getSellerProductsService(seller.id, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateProductPriceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerProductId } = req.params;
    const userId = req.session?.user?.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    const seller = await findById(userId);
    if (!seller) {
      throw new AppError('BadRequest', 400, 'You are not registered as a seller');
    }

    const result = await updateSellerProductPriceService(
      seller.id,
      sellerProductId,
      req.body
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
