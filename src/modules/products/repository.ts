import Product from './product.model';
import { Category } from './category.model';
import { SellerProduct } from './seller-product.model';
import { AppError } from '../../utils/AppError';

export const createProduct = async (data: any) => {
  return await Product.create(data);
};

export const findProductById = async (id: string) => {
  return await Product.findByPk(id);
};

export const findProductBySlug = async (slug: string) => {
  return await Product.findOne({ where: { slug } });
};

export const findAllProducts = async (filters: any) => {
  const { categoryId, status, limit = 20, offset = 0, search } = filters;
  const where: any = {};

  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (search) {
    // Will use raw query with LIKE
  }

  return await Product.findAndCountAll({
    where,
    limit,
    offset,
  });
};

export const updateProduct = async (id: string, data: any) => {
  const product = await findProductById(id);
  if (!product) throw new AppError('NotFound', 404, 'Product not found');
  return await product.update(data);
};

export const createCategory = async (data: any) => {
  return await Category.create(data);
};

export const findCategoryById = async (id: string) => {
  return await Category.findByPk(id);
};

export const findAllCategories = async (filters: any) => {
  const { isActive = true, limit = 100, offset = 0 } = filters;
  return await Category.findAndCountAll({
    where: { isActive },
    limit,
    offset,
    order: [['displayOrder', 'ASC']],
  });
};

export const createSellerProduct = async (data: any) => {
  return await SellerProduct.create(data);
};

export const findSellerProduct = async (sellerId: string, productId: string) => {
  return await SellerProduct.findOne({
    where: { sellerId, productId },
  });
};

export const findSellerProductById = async (id: string) => {
  return await SellerProduct.findByPk(id);
};

export const findBySellerAndProduct = async (sellerId: string, productId: string) => {
  return await SellerProduct.findOne({
    where: { sellerId, productId },
  });
};

export const getAllSellersForProduct = async (productId: string) => {
  return await SellerProduct.findAll({
    where: { productId, status: 'ACTIVE' },
    order: [['sellerPrice', 'ASC']],
  });
};

export const getSellerProducts = async (sellerId: string, filters: any) => {
  const { limit = 20, offset = 0, status } = filters;
  const where: any = { sellerId };
  if (status) where.status = status;

  return await SellerProduct.findAndCountAll({
    where,
    limit,
    offset,
  });
};

export const updateSellerProduct = async (id: string, data: any) => {
  const sp = await findSellerProductById(id);
  if (!sp) throw new AppError('NotFound', 404, 'Seller product not found');
  return await sp.update(data);
};
