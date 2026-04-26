import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import {
  createProductService,
  getProductDetailsService,
  fetchProductsService,
  getCategoriesService,
  createCategoryService,
  addProductToSellerService,
  getSellerProductsService,
  updateSellerProductPriceService,
  updateSellerProductStatusService,
} from './service';
import { findById } from '../../sellers/repository';
import { AppError } from '../../../utils/AppError';
import { findAllProducts } from './repository';

export const createProductHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Create Product (master catalog)
    const product = await createProductService(req.body);

    // Get sellerId from session (assumes session-based auth)
    const userId = req.session?.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }
    const seller = await findById(userId);
    if (!seller) {
      throw new AppError('BadRequest', 400, 'You are not registered as a seller');
    }

    // Create SellerProduct (seller listing)
    const sellerProduct = await addProductToSellerService(seller.id, product.id, req.body);

    // Return both Product and SellerProduct
    res.status(201).json({ success: true, data: { product, sellerProduct } });
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

    const payload = JSON.stringify(product);
    const etag = createHash('md5').update(payload).digest('hex');
    res.setHeader('ETag', etag);

    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch.toString() === etag) {
      return res.status(304).end();
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const fetchProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findAllProducts(req.query);
    // res.json handles ETag automatically in Express 4.x+
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
/**
 * Dedicated search handler using PostgreSQL Full-Text Search
 * Uses `q` parameter instead of `search` for semantic clarity
 * Applies aggressive caching for better performance
 */
export const searchProductsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Map 'q' parameter to 'search' for the service
    const searchParams = {
      ...req.query,
      search: req.query.q || req.query.search, // Support both 'q' and 'search'
    };

    // Validate search query
    const searchQuery = (searchParams.search as string)?.trim();
    if (!searchQuery || searchQuery.length === 0) {
      throw new AppError('ValidationError', 400, 'Search query cannot be empty');
    }

    if (searchQuery.length < 2) {
      throw new AppError('ValidationError', 400, 'Search query must be at least 2 characters');
    }

    // Fetch results using full-text search
    const result = await fetchProductsService(searchParams);

    // Generate ETag for aggressive caching (search results are deterministic)
    const payload = JSON.stringify(result);
    const etag = createHash('md5').update(payload).digest('hex');

    res.setHeader('ETag', etag);
    // Cache search results for 1 hour (search results are stable)
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch.toString() === etag) {
      return res.status(304).end();
    }

    res.json({ success: true, data: result });
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

    const payload = JSON.stringify(result);
    const etag = createHash('md5').update(payload).digest('hex');

    res.setHeader('ETag', etag);

    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch.toString() === etag) {
      return res.status(304).end();
    }

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

export const updateProductStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerProductId } = req.params;
    const { status } = req.body;
    const userId = req.session?.user?.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    const seller = await findById(userId);
    if (!seller) {
      throw new AppError('BadRequest', 400, 'You are not registered as a seller');
    }

    const result = await updateSellerProductStatusService(
      seller.id,
      sellerProductId,
      status
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
