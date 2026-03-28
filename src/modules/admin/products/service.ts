/**
 * Admin Products Service
 * Enterprise-grade business logic layer with clean architecture
 *
 * Architecture:
 * - Repository Pattern: Data access isolated in repository.ts
 * - Guard Functions: Validation and checks in guards.ts
 * - Transformers: Data transformation in transformer.ts
 * - Service: Pure business logic, minimal if statements
 */

import {
  getProductCount,
  findProducts,
  findById,
  updateFields,
  softDelete,
  updateStatus,
  updateMetadata,
  removeMetadata,
  getProductVariants,
  deleteProductVariantsByProduct,
  createProductVariants,
  upsertProductVariants,
} from "./repository";
import {
  createProductService,
  generateProductVariantsWithSku,
} from "../../website/products/service";
import {
  findProductBySku,
  findProductVariantBySku,
} from "../../website/products/repository";

import {
  requireProductExists,
  validateUpdateData,
  validatePaginationParams,
  validateFilterParams,
  handleServiceError,
} from "./guards";
import {
  transformProductToAdmin,
  transformProductsToAdmin,
  buildWhereClause,
  resolveSortColumn,
} from "./transformer";
import { AdminProductQuery, AdminProduct } from "./types";
import {
  calculatePagination,
  buildPaginatedResponse,
} from "../../shared/pagination";
import logger from "../../../utils/logger";
import { SellerProduct } from "./seller-product/model";
import { Inventory } from "../../sellers/inventory/model";
import { Seller } from "../../sellers/model";
import { sequelize } from "../../../db/sequelize";
import { QueryTypes } from "sequelize";

/**
 * List all products with advanced filtering and pagination
 */
export const adminListProducts = async (
  query: AdminProductQuery,
): Promise<ReturnType<typeof buildPaginatedResponse>> => {
  try {
    const { page, limit, offset } = validatePaginationParams(
      query.page,
      query.limit,
      100,
    );

    const filters = validateFilterParams(query);
    const { clause: whereClause, params: whereParams } =
      buildWhereClause(filters);
    const { column: sortColumn, order: sortOrder } = resolveSortColumn(
      query.sortBy,
    );

    const [total, rows] = await Promise.all([
      getProductCount(whereClause, whereParams),
      findProducts(
        whereClause,
        whereParams,
        sortColumn,
        sortOrder,
        limit,
        offset,
      ),
    ]);

    const products = await transformProductsToAdmin(rows);
    return buildPaginatedResponse(products, total, { page, limit, offset });
  } catch (error) {
    handleServiceError(error, "List products");
  }
};

/**
 * Get single product details
 */

const sellerOfferingsQuery = `
  SELECT
    sp.id as "sellerProductId",
    sp.seller_id as "sellerId",
    sp.seller_sku as "sellerSku",
    sp.seller_price as "sellerPrice",
    sp.cost_price as "costPrice",
    sp.discounted_price as "discountedPrice",
    sp.discounted_percent as "discountedPercent",
    sp.rating as "rating",
    sp.rating_count as "ratingCount",
    sp.description as "sellerDescription",
    sp.images as "sellerImages",
    sp.weight as "sellerWeight",
    sp.dimensions as "sellerDimensions",
    sp.warranty_months as "warrantyMonths",
    sp.status as "sellerProductStatus",
    sp.created_at as "sellerProductCreatedAt",
    sp.updated_at as "sellerProductUpdatedAt",
    s.business_name as "sellerBusinessName",
    s.owner_name as "sellerOwnerName",
    s.owner_email as "sellerOwnerEmail",
    s.business_phone as "sellerBusinessPhone",
    s.commission_rate as "sellerCommissionRate",
    s.status as "sellerStatus",
    i.id as "inventoryId",
    i.total_stock as "totalStock",
    i.available_stock as "availableStock",
    i.reserved_stock as "reservedStock",
    i.sold_stock as "soldStock",
    i.reorder_level as "reorderLevel",
    i.last_restocked_at as "lastRestockedAt"
  FROM seller_products sp
  INNER JOIN sellers s ON sp.seller_id = s.id
  LEFT JOIN inventory i ON sp.id = i.seller_product_id
  WHERE sp.product_id = :productId
  ORDER BY sp.created_at DESC
`;

export const adminGetProduct = async (
  id: string,
  sellerOfferingsPage: number = 1,
  sellerOfferingsLimit: number = 10
): Promise<any> => {
  try {
    await requireProductExists(id, "Product");
    const product = await findById(id);
    if (!product) {
      throw new Error("Product not found after exists check");
    }

    const variants = await getProductVariants(id);

    // Get total count of seller offerings
    const totalSellerOfferings = await sequelize.query(
      `SELECT COUNT(*) as count FROM seller_products WHERE product_id = :productId`,
      {
        replacements: { productId: id },
        type: QueryTypes.SELECT,
      }
    );

    const total = (totalSellerOfferings[0] as any).count;
    const offset = (sellerOfferingsPage - 1) * sellerOfferingsLimit;

    // Fetch paginated seller offerings
    const sellerOfferings = await sequelize.query(
      `${sellerOfferingsQuery} LIMIT :limit OFFSET :offset`,
      {
        replacements: { productId: id, limit: sellerOfferingsLimit, offset },
        type: QueryTypes.SELECT,
      }
    );

    const totalPages = Math.ceil(total / sellerOfferingsLimit);

    const rowWithVariants = {
      ...product,
      variants: variants || [],
      sellerOfferings: sellerOfferings || [],
      sellerOfferingsPagination: {
        total,
        page: sellerOfferingsPage,
        limit: sellerOfferingsLimit,
        totalPages,
      },
    };

    return await transformProductToAdmin(rowWithVariants as any);
  } catch (error) {
    handleServiceError(error, "Fetch product");
  }
};

/**
 * Update product information
 */
export const adminUpdateProduct = async (
  id: string,
  data: any,
): Promise<any> => {
  try {
    await requireProductExists(id, "Product");
    const updates = validateUpdateData(data);

    // Remove unused fields - SKU and pricing now handled at variant level
    if (updates.sku) {
      delete updates.sku;
    }

    const existingVariant = await findProductVariantBySku(updates.sku);
    if (existingVariant) {
      throw new Error("SKU conflicts with existing variant");
    }

    // Remove price/discount fields from main product since they're now handled by variants
    delete updates.price;
    delete updates.discountedPrice;
    delete updates.discountedPercent;
    delete updates.weight;

    const variantUpdateData = updates.variants;
    delete updates.variants;

    await updateFields(id, updates);

    // Handle variant updates intelligently - only update/create what's provided
    if (Array.isArray(variantUpdateData) && variantUpdateData.length > 0) {
      await upsertProductVariants(id, variantUpdateData);
    }

    logger.info("Product updated", { productId: id, updates });
    return await adminGetProduct(id);
  } catch (error) {
    handleServiceError(error, "Update product");
  }
};

/**
 * Delete product (soft delete)
 */
export const adminDeleteProduct = async (id: string): Promise<any> => {
  try {
    await requireProductExists(id, "Product");
    await softDelete(id);
    logger.info("Product deleted", { productId: id });
    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    handleServiceError(error, "Delete product");
  }
};

/**
 * Publish product
 */
export const adminPublishProduct = async (id: string): Promise<any> => {
  try {
    await requireProductExists(id, "Product");
    await updateStatus(id, "ACTIVE");
    logger.info("Product published", { productId: id });
    return await adminGetProduct(id);
  } catch (error) {
    handleServiceError(error, "Publish product");
  }
};

/**
 * Unpublish product
 */
export const adminUnpublishProduct = async (id: string): Promise<any> => {
  try {
    await requireProductExists(id, "Product");
    await updateStatus(id, "INACTIVE");
    logger.info("Product unpublished", { productId: id });
    return await adminGetProduct(id);
  } catch (error) {
    handleServiceError(error, "Unpublish product");
  }
};

/**
 * Mark product as featured
 */
export const adminFeatureProduct = async (id: string): Promise<any> => {
  try {
    await requireProductExists(id, "Product");
    await updateMetadata(id, "featured", true);
    logger.info("Product featured", { productId: id });
    return await adminGetProduct(id);
  } catch (error) {
    handleServiceError(error, "Feature product");
  }
};

/**
 * Remove product from featured
 */
export const adminCreateProduct = async (input: any): Promise<any> => {
  try {
    const {
      name,
      slug,
      description,
      weight,
      gst_rate,
      status,
      categoryId,
      images,
      stock = 0,
      addedBy,
      isNew,
      isCustomerFavourites,
      isBestseller,
    } = input;

    if (!name || !(categoryId || input.category)) {
      throw new Error("Name and categoryId are required");
    }

    const finalSlug = (slug || name)
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const productPayload = {
      name,
      description,
      slug: finalSlug,
      categoryId: categoryId || input.category,
      weight: weight !== undefined ? Number(weight) : undefined,
      gst_rate: Number(gst_rate ?? 18),
      status:
        status && (status === "ACTIVE" || status === "INACTIVE")
          ? status
          : "ACTIVE",
      images: images || [],
      variants: Array.isArray(input.variants) ? input.variants : [],
      stock: parseInt(stock) || 0,
      addedBy: addedBy || null,
      isNew: isNew ?? false,
      isCustomerFavourites: isCustomerFavourites ?? false,
      isBestseller: isBestseller ?? false,
    };

    const created = await createProductService(productPayload);

    return created;
  } catch (error) {
    handleServiceError(error, "Create product");
  }
};

export const adminUnfeatureProduct = async (id: string): Promise<any> => {
  try {
    await requireProductExists(id, "Product");
    await removeMetadata(id, "featured");
    logger.info("Product unfeatured", { productId: id });
    return await adminGetProduct(id);
  } catch (error) {
    handleServiceError(error, "Unfeature product");
  }
};
