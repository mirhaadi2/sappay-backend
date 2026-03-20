import Product from './product.model';
import { fetchFromR2, getR2SignedUrl } from '../uploads/r2-utils';
import { Category } from './category.model';
import { SellerProduct } from './seller-product.model';
import { AppError } from '../../utils/AppError';
import { sequelize } from '../../db/sequelize';
import { QueryTypes } from 'sequelize';

export const createProduct = async (data: any) => {
  return await Product.create(data);
};

export const findProductById = async (id: string) => {
  return await Product.findByPk(id, {
    include: [
      {
        model: SellerProduct,
        as: 'sellerProducts',
        attributes: ['id', 'sellerId', 'sellerPrice', 'costPrice', 'discountedPrice', 'discountedPercent', 'rating', 'ratingCount', 'status'],
        where: { status: 'ACTIVE' },
        required: false,
      },
    ],
  });
};

export const findProductBySlug = async (slug: string) => {
  return await Product.findOne({ where: { slug } });
};

export const findAllProducts = async (filters: any) => {
  const { categoryId, status, limit = 20, offset = 0, search } = filters;
  const where: any = {};

  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;

  // Fetch products
  const products = await Product.findAll({
    where,
    limit,
    offset,
    raw: true,
    order: [['createdAt', 'DESC']],
  });

  // Helper to resolve R2 image key to URL using fetchFromR2 and getR2SignedUrl
  const resolveR2Url = async (key: string) => {
    if (!key) return '';
    if (key.startsWith('http://') || key.startsWith('https://')) return key;
    // Try to fetch file from R2 (optional, for existence check)
    try {
      const data = await fetchFromR2(key);
      console.log(data,'data') // If file exists, get signed URL
      return getR2SignedUrl(key);
    } catch (err) {
      // If not found, fallback
      return '';
    }
  };

  for (const product of products) {
    if (Array.isArray(product.images)) {
      const resolvedImages = await Promise.all(
        product.images.map(async (imgKey: string) => await resolveR2Url(imgKey))
      );
      product.images = resolvedImages;
    }
  }

  const total = await Product.count({ where });

  return {
    products,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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
  return await Category.findAll({
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
  const query = `
    SELECT 
      sp.id as "sellerProductId",
      sp.product_id as "productId", 
      sp.seller_price as "sellerPrice", 
      p.name, p.slug, 
      p.images, 
      p.category_id as "categoryId", 
      sp.cost_price as "costPrice", 
      sp.discounted_price as "discountedPrice", 
      sp.discounted_percent as "discountedPercent", 
      sp.rating,
      sp.rating_count as "ratingCount",
      i.available_stock as "availableStock", 
      sp.status
    FROM seller_products sp
    JOIN products p ON sp.product_id = p.id
    LEFT JOIN "inventory" i ON sp.id = i.seller_product_id
    WHERE sp.seller_id = :sellerId
    ${status ? 'AND sp.status = :status' : ''}
    ORDER BY sp.created_at DESC
    LIMIT :limit OFFSET :offset
  `;
  
  const replacements: any = { sellerId, limit, offset };
  if (status) replacements.status = status;

  const results : any = await sequelize?.query(query, {
    replacements,
    type: QueryTypes.SELECT,
    logging(sql, timing) {
      console.log('Executed SQL:', sql);
      if (timing) console.log('Execution time:', timing, 'ms');
    },
    benchmark: true,
  });

  const total = await SellerProduct.count({ where });

  return {
    products: results,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const updateSellerProduct = async (id: string, data: any) => {
  const sp = await findSellerProductById(id);
  if (!sp) throw new AppError('NotFound', 404, 'Seller product not found');
  return await sp.update(data);
};
