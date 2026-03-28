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
  return await Product.findByPk(id, {
    include: [
      {
        model: ProductVariant,
        as: "variants",
      },
    ],
  });
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

export const findAllProducts = async (filters: any) => {
  const { categoryId, status, limit = 20, offset = 0, search } = filters;
  const where: any = {};

  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;

  // Fetch products with variants and seller pricing
  const products = await Product.findAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: ProductVariant,
        as: "variants",
      },
    ],
  });

  // Helper to resolve R2 image key to URL using fetchFromR2 and getR2SignedUrl
  const resolveR2Url = async (key: string) => {
    if (!key) return "";
    if (key.startsWith("http://") || key.startsWith("https://")) return key;
    // Try to fetch file from R2 (optional, for existence check)
    try {
      const data = await fetchFromR2(key);
      return getR2SignedUrl(key);
    } catch (err) {
      // If not found, fallback
      return "";
    }
  };

  const formattedProducts: any[] = [];

  for (const product of products) {
    const category = await Category.findByPk(product.categoryId);

    const productJson: any = product.toJSON ? product.toJSON() : product;
    productJson.category = category?.name || null;

    if (Array.isArray(productJson.images)) {
      const resolvedImages = await Promise.all(
        productJson.images.map(
          async (imgKey: string) => await resolveR2Url(imgKey),
        ),
      );
      productJson.images = resolvedImages;
    }

    const variantPrices = (productJson.variants || []).map((v: any) =>
      Number(v.price),
    );
    const variantMinPrice = variantPrices.length
      ? Math.min(...variantPrices)
      : undefined;

    productJson.variantCount = (productJson.variants || []).length;

    // For weight-based products, display price is the minimum weight variant price
    // Product basePrice is used only if no variants exist
    if (productJson.variantCount > 0) {
      productJson.price = variantMinPrice;
      // Set originalPrice to basePrice if it exists and is different from variant price
      if (
        productJson.basePrice &&
        Number(productJson.basePrice) !== variantMinPrice
      ) {
        productJson.originalPrice = Number(productJson.basePrice);
      }
    } else {
      productJson.price = Number(
        productJson.basePrice ?? productJson.price ?? 0,
      );
    }

    // Ensure main product discount fields are included
    if (productJson.discountedPrice) {
      productJson.discountedPrice = Number(productJson.discountedPrice);
    }
    if (productJson.discountedPercent) {
      productJson.discountedPercent = Number(productJson.discountedPercent);
    }

    formattedProducts.push(productJson);
  }

  const total = await Product.count({ where });

  return {
    products: formattedProducts,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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
