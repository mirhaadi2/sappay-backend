import {
  findProductById,
  findCategoryById,
  findProductBySlug,
  findProductBySku,
  findProductVariantBySku,
  createProduct,
  findBySellerAndProduct,
  createSellerProduct,
  getAllSellersForProduct,
  findAllProducts,
  findAllCategories,
  getSellerProducts,
  findSellerProductById,
  updateSellerProduct,
  createCategory,
  createProductVariants,
  invalidateProductsCache,
  invalidateCategoriesCache,
  findProductByIdOrSlug,
} from './repository';
import { generateSku, normalizeSku } from '../../../utils/sku';
import { sequelize } from '../../../db/sequelize';
import { withTransaction } from '../../../utils/transaction';

const calculateDiscountedPercent = (
  price: number | undefined,
  discountedPrice: number | undefined
): number | undefined => {
  if (price === undefined || discountedPrice === undefined) return undefined;
  if (Number.isNaN(price) || Number.isNaN(discountedPrice) || price <= 0) return undefined;
  return Number((((price - discountedPrice) / price) * 100).toFixed(2));
};

import { initializeInventoryService, initializeAdminProductStockService } from '../../sellers/inventory/service';
import { AppError } from '../../../utils/AppError';

export { invalidateProductsCache, invalidateCategoriesCache } from './repository';

export const createProductService = async (data: any) => {
  return withTransaction(async (transaction) => {
    const { name, slug, categoryId, stock = 0 } = data;

    if (!name || !slug || !categoryId) {
      throw new AppError('BadRequest', 400, 'Missing required fields');
    }

    const category = await findCategoryById(categoryId);
    if (!category) {
      throw new AppError('NotFound', 404, 'Category not found');
    }

    const existingProduct = await findProductBySlug(slug);
    if (existingProduct) {
      throw new AppError('BadRequest', 400, 'Product slug already exists');
    }

    // Remove price/discount fields from main product since they're now handled by variants
    delete data.price;
    delete data.discountedPrice;
    delete data.discountedPercent;
    delete data.weight;
    delete data.stock;

    // SKU handling - generate SKU for main product
    if (data.sku) {
      data.sku = normalizeSku(String(data.sku));
      const existingProduct = await findProductBySku(data.sku);
      if (existingProduct) {
        throw new AppError('BadRequest', 400, 'Product SKU already exists');
      }
      const existingVariant = await findProductVariantBySku(data.sku);
      if (existingVariant) {
        throw new AppError('BadRequest', 400, 'SKU conflicts with existing variant');
      }
    } else {
      let attempt = 0;
      do {
        data.sku = generateSku(data.name);
        const existingProduct = await findProductBySku(data.sku);
        const existingVariant = await findProductVariantBySku(data.sku);
        if (!existingProduct && !existingVariant) break;
        attempt += 1;
      } while (attempt < 10);

      if (!data.sku) {
        throw new AppError('Conflict', 409, 'Could not generate unique SKU');
      }
    }

    const variants = Array.isArray(data.variants) ? data.variants : [];
    delete data.variants;

    const product = await createProduct(data, transaction);

    if (variants.length > 0) {
      const finalVariants = await generateProductVariantsWithSku(data.name, variants);
      await createProductVariants(product.id, finalVariants, transaction);
    }

    // Initialize stock for admin-created products
    if (stock && parseInt(stock) > 0) {
      await initializeAdminProductStockService(product.id, parseInt(stock), data?.addedBy, transaction);
    }

    // Invalidate product list cache for consistent reads across categories/flows
    await invalidateProductsCache();

    return product;
  });
};

export const generateProductVariantsWithSku = async (
  productName: string,
  variants: any[]
) => {
  const finalVariants: any[] = [];

  for (const variant of variants) {
    if (variant.price === undefined || variant.price === null) continue;

    const v: any = {
      price: Number(variant.price),
      weight: variant.weight !== undefined ? Number(variant.weight) : undefined,
      status: variant.status || 'ACTIVE',
      weightUnit: variant.weightUnit || 'G',
      discountedPrice: variant.discountedPrice !== undefined ? Number(variant.discountedPrice) : undefined,
      discountedPercent: variant.discountedPercent !== undefined
        ? Number(variant.discountedPercent)
        : calculateDiscountedPercent(variant.price, variant.discountedPrice),
    };

    let attempt = 0;
    do {
      v.sku = generateSku(productName, v.weight);
      const existingProduct = await findProductBySku(v.sku);
      const existingVariant = await findProductVariantBySku(v.sku);
      if (!existingProduct && !existingVariant) break;
      attempt += 1;
    } while (attempt < 10);

    if (!v.sku) {
      throw new AppError('Conflict', 409, 'Could not generate unique SKU for variant');
    }

    finalVariants.push(v);
  }

  return finalVariants;
};

export const addProductToSellerService = async (
  sellerId: string,
  productId: string,
  sellerData: any
) => {
  const { sellerPrice, stock = 0 } = sellerData;

  if (!sellerPrice) {
    throw new AppError('BadRequest', 400, 'Seller price is required');
  }

  // Validate stock
  if (stock === undefined || stock === null) {
    throw new AppError('BadRequest', 400, 'Stock is required');
  }

  if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
    throw new AppError('BadRequest', 400, 'Stock must be a positive number');
  }

  // if (costPrice > sellerPrice) {
  //   throw new AppError('BadRequest', 400, 'Selling price cannot be less than cost price');
  // }

  const existing = await findBySellerAndProduct(sellerId, productId);
  if (existing) {
    throw new AppError('BadRequest', 400, 'You already have this product listed');
  }

  // Create SellerProduct
  const sellerProduct = await createSellerProduct({
    sellerId,
    productId,
    ...sellerData,
  });

  // Initialize inventory for this seller product with initial stock
  const inventory = await initializeInventoryService(sellerProduct.id, parseInt(stock));

  return {
    sellerProduct,
    inventory,
  };
};

export const getProductDetailsService = async (productId: string) => {
  const product = await findProductByIdOrSlug(productId);
  return product;
};

export const fetchProductsService = async (filters: any) => {
  return await findAllProducts(filters);
};

export const createCategoryService = async (data: any) => {
  const { name, slug } = data;

  if (!name || !slug) {
    throw new AppError('BadRequest', 400, 'Name and slug are required');
  }

  const category = await createCategory(data);
  await invalidateCategoriesCache();
  return category;
};

export const getCategoriesService = async (filters: any = {}) => {
  return await findAllCategories(filters);
};

export const getSellerProductsService = async (sellerId: string, filters: any) => {
  return await getSellerProducts(sellerId, filters);
};

export const updateSellerProductPriceService = async (
  sellerId: string,
  sellerProductId: string,
  updates: any
) => {
  const sp = await findSellerProductById(sellerProductId);
  if (!sp) {
    throw new AppError('NotFound', 404, 'Product not found');
  }

  if (sp.sellerId !== sellerId) {
    throw new AppError('Forbidden', 403, 'Unauthorized');
  }

  const { sellerPrice, costPrice } = updates;
  if (sellerPrice && costPrice && costPrice > sellerPrice) {
    throw new AppError('BadRequest', 400, 'Selling price cannot be less than cost price');
  }

  const updated = await updateSellerProduct(sellerProductId, updates);
  await invalidateProductsCache();
  return updated;
};

export const updateSellerProductStatusService = async (
  sellerId: string,
  sellerProductId: string,
  status: 'ACTIVE' | 'INACTIVE'
) => {
  const sp = await findSellerProductById(sellerProductId);
  if (!sp) {
    throw new AppError('NotFound', 404, 'Product not found');
  }

  if (sp.sellerId !== sellerId) {
    throw new AppError('Forbidden', 403, 'Unauthorized');
  }

  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new AppError('BadRequest', 400, 'Invalid status value');
  }

  const updated = await updateSellerProduct(sellerProductId, { status });
  await invalidateProductsCache();
  return updated;
};
