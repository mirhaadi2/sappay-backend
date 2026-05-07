import { Product } from "../../admin/products/model";
import { ProductVariant } from "../../admin/products/product-variant/model";
import { fetchFromR2, getR2SignedUrl, resolveR2Urls } from "../../uploads/r2-utils";
import { Category } from "../../admin/products/categories/model";
import { SellerProduct } from "../../admin/products/seller-product/model";
import { AppError } from "../../../utils/AppError";
import { sequelize } from "../../../db/sequelize";
import { QueryTypes, Op, Transaction } from "sequelize";
import { createHash } from "crypto";
import { redisClient } from "../../../config/session";
import logger from "../../../utils/logger";

export const createProduct = async (data: any, transaction?: any) => {
  const product = await Product.create(data, { transaction });
  logger.info('Product created', { productId: product?.dataValues?.id || product.id, name: data.name });
  return product;
};

export const findVariantsByProductId = async (productId: string) => {
  return await ProductVariant.findAll({
    where: { productId },
    order: [["createdAt", "ASC"]],
    raw: true,
  });
};

export const findProductById = async (id: string, transaction?: Transaction) => {
  const query = `
    SELECT
      p.id, p.name, p.slug, p.benefits, p.ingredients, p.description,
      p.images, p.gst_rate, p.category_id as "categoryId",
      p.nutrition_facts as "nutritionFacts",
      p.is_new as "isNew",
      p.is_customer_favourites as "isCustomerFavourites",
      p.is_best_seller as "isBestseller",
      c.name as "category",
      COALESCE(MAX(i.available_stock), 0) as "availableStock",
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', pv.id,
            'sku', pv.sku,
            'price', pv.price,
            'discountedPrice', pv.discounted_price,
            'discountedPercent', pv.discounted_percent,
            'weight', pv.weight,
            'weightUnit', pv.weight_unit
          )
        ) FILTER (WHERE pv.id IS NOT NULL), '[]'
      ) as "variants"
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN inventory i ON i.product_id = p.id
    LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.status = 'ACTIVE'
    WHERE p.id = :id AND p.status = 'ACTIVE'
    GROUP BY p.id, c.name
    LIMIT 1
  `;

  const products = await sequelize.query(query, {
    replacements: { id },
    type: QueryTypes.SELECT,
    plain: true, // Returns a single object instead of an array
    benchmark: true,
    logging: (sql, timing) => console.log(`[SQL] ${timing}ms`),
    transaction,
  }) as any | null;

  if (!products) return null;

  const [resolvedImages] = await Promise.all([
    resolveR2Urls(products.images || [])
  ]);

  const variants = products.variants || [];
  const availableStock = products?.availableStock ? parseFloat(products?.availableStock) : 0;
  const isProductAvailable = availableStock > 0;

  // Add isAvailable to each variant
  const variantsWithAvailability = (variants || []).map((variant: any) => {
    // 1. Convert availableStock (e.g., 1.75) to total grams (1750)
    const stockInGrams = (availableStock || 0) * 1000;


    // 2. Convert variant weight to grams based on its unit
    let variantWeightInGrams = Number(variant.weight) || 0;

    if (variant.weightUnit?.toLowerCase() === 'kg') {
      variantWeightInGrams = variantWeightInGrams * 1000;
    }

    return {
      ...variant,
      isAvailable: stockInGrams >= variantWeightInGrams
    };
  });


  let minPrice = 0;
  if (variants.length > 0) {
    minPrice = variants.reduce((min: number, v: any) => (v.price < min ? v.price : min), variants[0].price);
  }

  return {
    ...products,
    images: resolvedImages,
    price: Number(minPrice),
    variantCount: variants.length,
    variants: variantsWithAvailability,
    isAvailable: isProductAvailable,
  };
};

export const findProductBySlug = async (slug: string, transaction?: Transaction) => {
  const query = `
    SELECT
      p.id, p.name, p.slug, p.benefits, p.ingredients, p.description,
      p.images, p.gst_rate, p.category_id as "categoryId",
      p.nutrition_facts as "nutritionFacts",
      p.is_new as "isNew",
      p.is_customer_favourites as "isCustomerFavourites",
      p.is_best_seller as "isBestseller",
      c.name as "category",
      COALESCE(MAX(i.available_stock), 0) as "availableStock",
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', pv.id,
            'sku', pv.sku,
            'price', pv.price,
            'discountedPrice', pv.discounted_price,
            'discountedPercent', pv.discounted_percent,
            'weight', pv.weight,
            'weightUnit', pv.weight_unit
          )
        ) FILTER (WHERE pv.id IS NOT NULL), '[]'
      ) as "variants"
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN inventory i ON i.product_id = p.id
    LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.status = 'ACTIVE'
    WHERE p.slug = :slug AND p.status = 'ACTIVE'
    GROUP BY p.id, c.name
    LIMIT 1
  `;

  const products = await sequelize.query(query, {
    replacements: { slug },
    type: QueryTypes.SELECT,
    plain: true, // Returns a single object instead of an array
    benchmark: true,
    logging: (sql, timing) => console.log(`[SQL] ${timing}ms`),
    transaction,
  }) as any | null;

  if (!products) return null;

  const [resolvedImages] = await Promise.all([
    resolveR2Urls(products.images || [])
  ]);

  const variants = products.variants || [];
  const availableStock = products?.availableStock ? parseFloat(products?.availableStock) : 0;
  const isProductAvailable = availableStock > 0;

  // Add isAvailable to each variant
  const variantsWithAvailability = (variants || []).map((variant: any) => {
    // 1. Convert availableStock (e.g., 1.75) to total grams (1750)
    const stockInGrams = (availableStock || 0) * 1000;

    // 2. Convert variant weight to grams based on its unit
    let variantWeightInGrams = Number(variant.weight) || 0;

    if (variant.weightUnit?.toLowerCase() === 'kg') {
      variantWeightInGrams = variantWeightInGrams * 1000;
    }

    return {
      ...variant,
      isAvailable: stockInGrams >= variantWeightInGrams
    };
  });

  let minPrice = 0;
  if (variants.length > 0) {
    minPrice = variants.reduce((min: number, v: any) => (v.price < min ? v.price : min), variants[0].price);
  }

  return {
    ...products,
    images: resolvedImages,
    price: Number(minPrice),
    variantCount: variants.length,
    variants: variantsWithAvailability,
    isAvailable: isProductAvailable,
  };
};

/**
 * Find product by slug or ID with intelligent fallback
 * Tries slug first (for URLs), then falls back to UUID (for backward compatibility)
 * This enables professional URL structure like /products/organic-almonds-500g
 * while maintaining support for legacy UUID-based URLs
 */
export const findProductByIdOrSlug = async (identifier: string, transaction?: Transaction) => {
  if (!identifier) return null;

  // Detect if identifier is a UUID pattern (36 chars with hyphens at specific positions)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid = uuidRegex.test(identifier);

  if (isUuid) {
    // If it's a UUID, try ID lookup
    return await findProductById(identifier, transaction);
  } else {
    // If it's not a UUID (likely a slug), try slug lookup with full data processing
    const product = await findProductBySlug(identifier, transaction);
    if (product) return product;

    // Fallback to ID lookup for any other format (edge cases)
    return await findProductById(identifier, transaction);
  }
};

export const findProductBySku = async (sku: string) => {
  // SKU is no longer stored in main product table
  // It's now only in ProductVariant
  return null;
};

export const findProductVariantBySku = async (sku: string) => {
  if (!sku) return null;
  return await ProductVariant.findOne({ where: { sku } });
};

const resolveR2Url = async (key: string) => {
  if (!key) return "";
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  // Try to fetch file from R2 (optional, for existence check)
  try {
    const data = await fetchFromR2(key);
    return getR2SignedUrl(key);
  } catch (err) {
    return "";
  }
};

/**
 * Interface defining the expected filters
 */
interface ProductFilters {
  [key: string]: any;
}

const PRODUCT_LIST_CACHE_TTL = 60 * 2; // 2 minutes

const getProductsCacheKey = (filters: ProductFilters): string => {
  const normalized = Object.keys(filters || {})
    .sort()
    .reduce((acc: any, key) => {
      acc[key] = filters[key];
      return acc;
    }, {});

  const hash = createHash("md5")
    .update(JSON.stringify(normalized))
    .digest("hex");

  return `website:products:${hash}`;
};

const getCategoriesCacheKey = (filters: any): string => {
  const normalized = Object.keys(filters || {})
    .sort()
    .reduce((acc: any, key) => {
      acc[key] = filters[key];
      return acc;
    }, {});

  const hash = createHash("md5")
    .update(JSON.stringify(normalized))
    .digest("hex");

  return `website:categories:${hash}`;
};

export const invalidateProductsCache = async () => {
  try {
    if (!redisClient.isOpen) return;
    const keys = await redisClient.keys("website:products:*");
    if (keys.length === 0) return;
    await redisClient.del(keys);
  } catch (err: any) {
    console.warn("Failed to invalidate products cache:", err?.message || err);
  }
};

export const invalidateCategoriesCache = async () => {
  try {
    if (!redisClient.isOpen) return;
    const keys = await redisClient.keys("website:categories:*");
    if (keys.length === 0) return;
    await redisClient.del(keys);
  } catch (err: any) {
    console.warn("Failed to invalidate categories cache:", err?.message || err);
  }
};

export const findAllProducts = async (filters: ProductFilters) => {
  const cacheKey = getProductsCacheKey(filters || {});

  // Fast-path: Cache check
  try {
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('Redis read failed:', err);
  }

  // Pagination & Filtering
  const { limit = 20, page = 1 } = filters;
  const parsedLimit = Math.min(Math.max(Number(limit), 1), 100);
  const parsedOffset = (Math.max(Number(page), 1) - 1) * parsedLimit;

  const { conditions, replacements, orderBy } = buildProductConditions(filters);
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Parallel Database Queries
  const [products, countResult]: [any[], any] = await Promise.all([
    sequelize.query(generateMainQuery(whereClause, orderBy), {
      replacements: { ...replacements, limit: parsedLimit, offset: parsedOffset },
      type: QueryTypes.SELECT,
    }),
    sequelize.query(`SELECT COUNT(p.id) as total FROM products p ${whereClause}`, {
      replacements,
      type: QueryTypes.SELECT,
      plain: true,
    }),
  ]);

  const total = Number(countResult?.total || 0);

  // High-speed Formatting (Batch Image Signing)
  const formattedProducts = await fastFormatProducts(products);

  const result = {
    products: formattedProducts,
    total,
    page: Math.max(Number(page), 1),
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit),
  };

  // Fire-and-forget cache write (don't await)
  if (redisClient.isOpen) {
    redisClient.set(cacheKey, JSON.stringify(result), { EX: 120 }).catch(() => { });
  }

  return result;
};

const fastFormatProducts = async (products: any[]) => {
  if (!products.length) return [];

  // Extract every unique image key across the entire result set
  const allImageKeys = products.flatMap(p => p.images || []);
  const uniqueKeys = [...new Set(allImageKeys)];

  const signedUrls = await resolveR2Urls(uniqueKeys);

  const signedUrlMap = new Map();
  uniqueKeys.forEach((key, index) => {
    signedUrlMap.set(key, signedUrls[index]);
  });

  return products.map(p => {
    const availableStock = p?.availableStock ? parseFloat(p?.availableStock) : 0;
    const isProductAvailable = availableStock > 0;
    const variantsWithAvailability = (p.variants || []).map((variant: any) => {
      // 1. Convert availableStock (e.g., 1.75) to total grams (1750)
      const stockInGrams = (availableStock || 0) * 1000;


      // 2. Convert variant weight to grams based on its unit
      let variantWeightInGrams = Number(variant.weight) || 0;

      if (variant.weightUnit?.toLowerCase() === 'kg') {
        variantWeightInGrams = variantWeightInGrams * 1000;
      }

      return {
        ...variant,
        isAvailable: stockInGrams >= variantWeightInGrams
      };
    });

    return {
      ...p,
      images: (p.images || []).map((key: string) => signedUrlMap.get(key)),
      price: Number(p.minPrice || 0), // Use SQL-calculated min price
      variantCount: p.variants?.length || 0,
      variants: variantsWithAvailability,
      availableStock,
      isAvailable: isProductAvailable,
    };
  });
}

const buildProductConditions = (filters: any) => {
  const conditions: string[] = [];
  const replacements: any = {};

  const addFilter = (col: string, param: string, value: any, operator = '=') => {
    if (value !== undefined && value !== null && value !== '') {
      conditions.push(`${col} ${operator} :${param}`);
      replacements[param] = value;
    }
  };

  addFilter('p.status', 'status', filters.status);
  addFilter('p.category_id', 'categoryId', filters.categoryId);

  // Full-text search using PostgreSQL tsvector for better performance & relevance
  if (filters.search && filters.search.trim()) {
    // Sanitize search input for security
    const sanitizedSearch = filters.search.trim().replace(/[;&|!<>]/g, '');
    conditions.push(`p.search_vector @@ plainto_tsquery('english', :searchQuery)`);
    replacements.searchQuery = sanitizedSearch;
  }

  // Handle Boolean Strings
  const booleans = [
    { key: 'isBestseller', col: 'p.is_best_seller' },
    { key: 'isNew', col: 'p.is_new' },
    { key: 'isCustomerFavourites', col: 'p.is_customer_favourites' },
  ];

  booleans.forEach(({ key, col }) => {
    if (filters[key] !== undefined) {
      conditions.push(`${col} = :${key}`);
      replacements[key] = filters[key] === 'true' || filters[key] === true;
    }
  });

  const sortMapping: Record<string, string> = {
    'newest': 'p.created_at DESC NULLS LAST',
    'price-asc': '"minPrice" ASC NULLS LAST',
    'price-desc': '"minPrice" DESC NULLS LAST',
    'rating': 'p.rating DESC NULLS LAST',
    'default': 'p.created_at DESC NULLS LAST'
  };

  // When searching, prioritize by relevance score, then by selected sort
  let orderBy = sortMapping[filters.sort] || sortMapping['default'];
  if (filters.search && filters.search.trim()) {
    const sanitizedSearch = filters.search.trim().replace(/[;&|!<>]/g, '');
    orderBy = `ts_rank(p.search_vector, plainto_tsquery('english', '${sanitizedSearch}')) DESC, ${orderBy}`;
  }

  return { conditions, replacements, orderBy };
}
const generateMainQuery = (whereClause: string, orderBy: string) => {
  return `
    SELECT
      p.id, 
      p.name, 
      p.slug, 
      p.category_id as "categoryId",
      c.name as "category", 
      p.description, 
      p.images, 
      p.gst_rate,
      p.is_new as "isNew", 
      p.is_best_seller as "isBestseller",
      p.is_customer_favourites as "isCustomerFavourites",
      COALESCE(MAX(i.available_stock), 0) as "availableStock",
      -- Calculate effective price per variant (discounted if available, else original)
      -- Then find minimum across all ACTIVE variants for this product
      COALESCE(
        MIN(COALESCE(pv.discounted_price, pv.price)),
        999999
      ) AS "minPrice",
      COALESCE(JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', pv.id, 
          'sku', pv.sku, 
          'price', pv.price,
          'discountedPrice', pv.discounted_price,
          'weight', pv.weight, 
          'weightUnit', pv.weight_unit
        )
      ) FILTER (WHERE pv.id IS NOT NULL), '[]') as "variants"
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.status = 'ACTIVE'
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN inventory i ON i.product_id = p.id
    ${whereClause}
    -- Group ONLY by product and category fields
    GROUP BY p.id, c.name
    ORDER BY ${orderBy}
    LIMIT :limit OFFSET :offset
  `;
};

export const findAllProductsCatalog = async (filters: any) => {
  const {
    limit = 100,
    offset = 0,
    search,
    categoryId,
    status = "ACTIVE",
  } = filters;
  const where: any = {};
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (search) where.name = { [Op.iLike]: `%${search}%` };

  const products = await Product.findAll({
    where,
    attributes: [
      "id",
      "name",
      "slug",
      "categoryId",
      "base_price",
      "images",
      "status",
      "createdAt",
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    raw: true,
  });

  return await Promise.all(
    products.map(async (product: any) => {
      const category = await Category.findByPk(product.categoryId, {
        raw: true,
        attributes: ["name"],
      });

      return {
        ...product,
        category: category?.name || null,
        price: Number(product.basePrice ?? product.price ?? 0),
      };
    }),
  );
};

export const createProductVariant = async (productId: string, variant: any) => {
  const transaction = await sequelize.transaction();
  try {
    const pv = await ProductVariant.create({
      productId,
      sku: variant.sku,
      price: Number(variant.price),
      weight: variant.weight !== undefined ? Number(variant.weight) : undefined,
      status: variant.status || "ACTIVE",
    }, { transaction });
    await transaction.commit();
    logger.info('Product variant created', { variantId: pv.id, productId, sku: variant.sku });
    return pv;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating product variant', { productId, sku: variant.sku, error });
    throw error;
  }
};

export const createProductVariants = async (
  productId: string,
  variants: any[],
  transaction?: any,
) => {
  if (!Array.isArray(variants)) return [];
  const sanitized = variants
    .filter((v) => v && v.price !== undefined)
    .map((v) => ({
      productId,
      sku: v.sku,
      price: Number(v.price),
      discountedPrice:
        v.discountedPrice !== undefined ? Number(v.discountedPrice) : undefined,
      discountedPercent:
        v.discountedPercent !== undefined
          ? Number(v.discountedPercent)
          : undefined,
      weight: v.weight !== undefined ? Number(v.weight) : undefined,
      weightUnit: v.weightUnit || "G",
      status: v.status || "ACTIVE",
    }));
  const result = await ProductVariant.bulkCreate(sanitized, { transaction });
  logger.info('Product variants created', { productId, count: result.length });
  return result;
};

export const getProductVariants = async (productId: string) => {
  return await ProductVariant.findAll({
    where: { productId },
    order: [["createdAt", "ASC"]],
  });
};

export const deleteProductVariantsByProduct = async (productId: string) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await ProductVariant.destroy({
      where: { productId },
      transaction
    });
    await transaction.commit();
    logger.info('Product variants deleted', { productId, count: result });
    return result;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting product variants', { productId, error });
    throw error;
  }
};

export const updateProduct = async (id: string, data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(id, { transaction });
    if (!product) throw new AppError("NotFound", 404, "Product not found");
    const updated = await product.update(data, { transaction });
    await transaction.commit();
    logger.info('Product updated', { productId: id });
    return updated;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating product', { productId: id, error });
    throw error;
  }
};

export const createCategory = async (data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const category = await Category.create(data, { transaction });
    await transaction.commit();
    logger.info('Category created', { categoryId: category.id, name: data.name });
    return category;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating category', { name: data.name, error });
    throw error;
  }
};

export const findCategoryById = async (id: string) => {
  return await Category.findByPk(id);
};

export const findAllCategories = async (filters: any) => {
  const cacheKey = getCategoriesCacheKey(filters || {});

  try {
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (err: any) {
    console.warn('Redis cache read failed in findAllCategories:', err?.message || err);
  }

  const { isActive = true, limit = 100, offset = 0 } = filters;
  const rows = await Category.findAll({
    where: { isActive },
    limit,
    offset,
    order: [["displayOrder", "ASC"]],
  });

  try {
    if (redisClient.isOpen) {
      await redisClient.set(cacheKey, JSON.stringify(rows), {
        EX: PRODUCT_LIST_CACHE_TTL,
      });
    }
  } catch (err: any) {
    console.warn('Redis cache write failed in findAllCategories:', err?.message || err);
  }

  return rows;
};

export const createSellerProduct = async (data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const sellerProduct = await SellerProduct.create(data, { transaction });
    await transaction.commit();
    logger.info('Seller product created', { sellerProductId: sellerProduct.id, sellerId: data.sellerId });
    return sellerProduct;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating seller product', { sellerId: data.sellerId, productId: data.productId, error });
    throw error;
  }
};

export const findSellerProduct = async (
  sellerId: string,
  productId: string,
) => {
  return await SellerProduct.findOne({
    where: { sellerId, productId },
  });
};

export const findSellerProductById = async (id: string) => {
  return await SellerProduct.findByPk(id);
};

export const findBySellerAndProduct = async (
  sellerId: string,
  productId: string,
) => {
  return await SellerProduct.findOne({
    where: { sellerId, productId },
  });
};

export const getAllSellersForProduct = async (productId: string) => {
  return await SellerProduct.findAll({
    where: { productId, status: "ACTIVE" },
    order: [["sellerPrice", "ASC"]],
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
    ${status ? "AND sp.status = :status" : ""}
    ORDER BY sp.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const replacements: any = { sellerId, limit, offset };
  if (status) replacements.status = status;

  const results: any = await sequelize?.query(query, {
    replacements,
    type: QueryTypes.SELECT,
    logging(sql, timing) {
      console.log("Executed SQL:", sql);
      if (timing) console.log("Execution time:", timing, "ms");
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
  const transaction = await sequelize.transaction();
  try {
    const sp = await SellerProduct.findByPk(id, { transaction });
    if (!sp) throw new AppError("NotFound", 404, "Seller product not found");
    const updated = await sp.update(data, { transaction });
    await transaction.commit();
    logger.info('Seller product updated', { sellerProductId: id });
    return updated;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating seller product', { sellerProductId: id, error });
    throw error;
  }
};
