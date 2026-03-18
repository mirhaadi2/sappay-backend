import {
  findProductById,
  findCategoryById,
  findProductBySlug,
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
} from './repository';
import { AppError } from '../../utils/AppError';

export const createProductService = async (data: any) => {
  const { name, slug, categoryId } = data;

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

  return await createProduct(data);
};

export const addProductToSellerService = async (
  sellerId: string,
  productId: string,
  sellerData: any
) => {
  const { sellerPrice, costPrice } = sellerData;

  if (!sellerPrice || !costPrice) {
    throw new AppError('BadRequest', 400, 'Price information is required');
  }

  if (costPrice > sellerPrice) {
    throw new AppError('BadRequest', 400, 'Selling price cannot be less than cost price');
  }

  const existing = await findBySellerAndProduct(sellerId, productId);
  if (existing) {
    throw new AppError('BadRequest', 400, 'You already have this product listed');
  }

  return await createSellerProduct({
    sellerId,
    productId,
    ...sellerData,
  });
};

export const getProductDetailsService = async (productId: string) => {
  const product = await findProductById(productId);
  if (!product) {
    throw new AppError('NotFound', 404, 'Product not found');
  }

  const sellers = await getAllSellersForProduct(productId);

  return {
    ...product.toJSON(),
    sellers: sellers.map((sp: any) => ({
      id: sp.id,
      sellerId: sp.sellerId,
      price: sp.sellerPrice,
      rating: 4.5,
      sellers: 150,
    })),
  };
};

export const fetchProductsService = async (filters: any) => {
  return await findAllProducts(filters);
};

export const createCategoryService = async (data: any) => {
  const { name, slug } = data;

  if (!name || !slug) {
    throw new AppError('BadRequest', 400, 'Name and slug are required');
  }

  return await createCategory(data);
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

  return await updateSellerProduct(sellerProductId, updates);
};
