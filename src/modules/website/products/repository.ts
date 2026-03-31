import Product from "../../admin/products/model";
import { ProductVariant } from "../../admin/products/product-variant/model";
import { fetchFromR2, getR2SignedUrl } from "../../uploads/r2-utils";
import { Category } from "../../admin/products/categories/model";
import { SellerProduct } from "../../admin/products/seller-product/model";
import { AppError } from "../../../utils/AppError";
import { sequelize } from "../../../db/sequelize";
import { QueryTypes, Op } from "sequelize";

export const createProduct = async (data: any) => {
  return await Product.create(data);
};

export const findVariantsByProductId = async (productId: string) => {
  return await ProductVariant.findAll({
    where: { productId },
    order: [["createdAt", "ASC"]],
    raw: true,
  });
};

export const findProductById = async (id: string) => {
  const query = `
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
      p.is_customer_favourites as "isCustomerFavourites",
      p.is_best_seller as "isBestseller",
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
      ) as "variants"
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.status = 'ACTIVE'
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'ACTIVE'
      AND p.id = :id
    GROUP BY p.id, c.name
    LIMIT 1
  `;

  const replacements: any = { id };
  const products: any = await sequelize?.query(query, {
    replacements,
    type: QueryTypes.SELECT,
    logging(sql, timing) {
      console.log("Executed SQL:", sql);
      if (timing) console.log("Execution time:", timing, "ms");
    },
    benchmark: true,
  });

  if (!products || !products?.[0]) return null;

  const variants = products?.[0]?.variants || [];
  const resolvedImages = Array.isArray(products?.[0]?.images)
    ? await Promise.all(
        products?.[0]?.images.map((imgKey: string) => resolveR2Url(imgKey)),
      )
    : [];

  const prices = variants.map((v: any) => Number(v.price));
  const formattedProduct = {
    ...products?.[0],
    images: resolvedImages,
    price: prices.length ? Math.min(...prices) : 0,
    variantCount: variants.length,
  };
  return formattedProduct;
};

export const findProductBySlug = async (slug: string) => {
  return await Product.findOne({ where: { slug } });
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
  categoryId?: string | number;
  status?: string;
  limit?: string | number;
  page?: string | number;
  search?: string;
  isBestseller?: boolean | string;
  isNew?: boolean | string;
  isCustomerFavourites?: boolean | string;
}

export const findAllProducts = async (filters: ProductFilters) => {
  // 1. Destructure with Defaults
  const { 
    limit = 20, 
    page = 1, 
    search, 
    categoryId, 
    status = 'ACTIVE' 
  } = filters || {};

  // 2. Normalize Pagination
  const parsedLimit = Math.min(Math.max(Number(limit), 1), 100);
  const parsedOffset = (Math.max(Number(page), 1) - 1) * parsedLimit;

  // 3. Dynamic Filter Builder
  // We separate conditions and replacements to reuse them for both Data and Count queries
  const { conditions, replacements } = buildProductConditions({
    ...filters,
    status, // Ensure status defaults to ACTIVE if not provided
  });

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // 4. Execute Queries in Parallel (Performance Boost)
  const [products, countResult]: [any[], any[]] = await Promise.all([
    sequelize.query(generateMainQuery(whereClause), {
      replacements: { ...replacements, limit: parsedLimit, offset: parsedOffset },
      type: QueryTypes.SELECT,
    }),
    sequelize.query(`SELECT COUNT(p.id) as total FROM products p ${whereClause}`, {
      replacements,
      type: QueryTypes.SELECT,
    }),
  ]);

  const total = Number(countResult[0]?.total || 0);

  // 5. Post-Processing Logic
  const formattedProducts = await formatProductData(products);

  return {
    products: formattedProducts,
    total,
    page: Math.max(Number(page), 1),
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit),
  };
};

/**
 * HELPER: Build dynamic SQL fragments
 */
function buildProductConditions(filters: any) {
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
  
  if (filters.search) {
    addFilter('p.name', 'search', `%${filters.search}%`, 'ILIKE');
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

  return { conditions, replacements };
}

/**
 * HELPER: Main SQL String
 */
function generateMainQuery(whereClause: string) {
  return `
    SELECT
      p.id, p.name, p.slug, p.category_id as "categoryId",
      c.name as "category", p.description, p.images, p.gst_rate,
      p.is_new as "isNew", p.is_customer_favourites as "isCustomerFavourites",
      p.is_best_seller as "isBestseller",
      COALESCE(JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', pv.id, 'sku', pv.sku, 'price', pv.price,
          'discountedPrice', pv.discounted_price,
          'weight', pv.weight, 'weightUnit', pv.weight_unit
        )
      ) FILTER (WHERE pv.id IS NOT NULL), '[]') as "variants"
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.status = 'ACTIVE'
    LEFT JOIN categories c ON c.id = p.category_id
    ${whereClause}
    GROUP BY p.id, c.name
    ORDER BY p.created_at DESC
    LIMIT :limit OFFSET :offset
  `;
}

/**
 * HELPER: Formatting and Async Image Resolution
 */
async function formatProductData(products: any[]) {
  return Promise.all(products.map(async (product) => {
    const images = Array.isArray(product.images) 
      ? await Promise.all(product.images.map(resolveR2Url)) 
      : [];

    const prices = product.variants.map((v: any) => Number(v.price));
    
    return {
      ...product,
      images,
      price: prices.length ? Math.min(...prices) : 0,
      variantCount: product.variants.length,
    };
  }));
}

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
  return await ProductVariant.create({
    productId,
    sku: variant.sku,
    price: Number(variant.price),
    weight: variant.weight !== undefined ? Number(variant.weight) : undefined,
    status: variant.status || "ACTIVE",
  });
};

export const createProductVariants = async (
  productId: string,
  variants: any[],
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
  return await ProductVariant.bulkCreate(sanitized);
};

export const getProductVariants = async (productId: string) => {
  return await ProductVariant.findAll({
    where: { productId },
    order: [["createdAt", "ASC"]],
  });
};

export const deleteProductVariantsByProduct = async (productId: string) => {
  return await ProductVariant.destroy({
    where: { productId },
  });
};

export const updateProduct = async (id: string, data: any) => {
  const product = await findProductById(id);
  if (!product) throw new AppError("NotFound", 404, "Product not found");
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
    order: [["displayOrder", "ASC"]],
  });
};

export const createSellerProduct = async (data: any) => {
  return await SellerProduct.create(data);
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
  const sp = await findSellerProductById(id);
  if (!sp) throw new AppError("NotFound", 404, "Seller product not found");
  return await sp.update(data);
};
