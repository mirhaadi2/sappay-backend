/**
 * Product Database Repository
 * Centralized data access layer with type safety
 * Functional approach for simplicity and composability
 */

import { sequelize } from "../../../db/sequelize";
import { ProductRow, CountRow } from "./database.types";
import { QueryTypes } from "sequelize";
import { randomUUID } from "crypto";
import { generateSku } from "../../../utils/sku";
import logger from "../../../utils/logger";

/**
 * Execute parameterized SELECT query with type safety
 */
const executeSelect = async <T>(
  query: string,
  replacements: any = [],
  transaction?: any,
): Promise<T[]> => {
  var timing = 0;
  try {
    const result = (await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
      transaction,
      logging(sql, queryTiming) {
        logger.debug("Database SELECT query executed", {
          sql,
          timing: queryTiming,
        });
        timing = queryTiming || 0;
      },
      benchmark: true,
    })) as T[];
    logger.info("Database SELECT query completed successfully", {
      rowCount: result?.length || 0,
    });
    return result || [];
  } catch (error: any) {
    logger.error("Database SELECT query failed", {
      query,
      replacements,
      error,
    });
    throw error;
  }
};

/**
 * Execute parameterized UPDATE/DELETE query
 */
const executeModify = async (
  query: string,
  replacements: any = [],
  transaction?: any,
): Promise<number> => {
  var timing = 0;
  try {
    await sequelize.query(query, {
      replacements,
      transaction,
      logging(sql, queryTiming) {
        logger.debug("Database MODIFY query executed", {
          sql,
          timing: queryTiming,
        });
        timing = queryTiming || 0;
      },
      benchmark: true,
    });
    logger.info("Database MODIFY query completed successfully");
    return 1;
  } catch (error: any) {
    logger.error("Database MODIFY query failed", {
      query,
      replacements,
      error,
    });
    throw error;
  }
};

/**
 * Get product count with optional WHERE conditions
 */
export const getProductCount = async (
  whereClause: string,
  params: any[] = [],
): Promise<number> => {
  const query = `SELECT COUNT(*) as count FROM products p WHERE ${whereClause}`;
  const replacements = Object.fromEntries(
    params.map((v, i) => [`param${i}`, v]),
  );
  const result = await executeSelect<CountRow>(query, replacements);
  return parseInt(result[0]?.count || "0", 10);
};

/**
 * Find products with pagination and filtering
 */
export const findProducts = async (
  whereClause: string,
  params: any[],
  sortBy: string,
  sortOrder: string,
  limit: number,
  offset: number,
): Promise<ProductRow[]> => {
  const query = `
    WITH InventoryStats AS (
        -- Aggregate inventory at the product level first
        -- This avoids multiple subqueries in the main select
      SELECT 
        sp.product_id,
        SUM(COALESCE(i.available_stock, 0)) as total_stock,
        COUNT(DISTINCT i.id) as inventory_records_count
      FROM seller_products sp
      LEFT JOIN inventory i ON sp.id = i.seller_product_id
      GROUP BY sp.product_id
    ),
    VariantStats AS (
      -- Get price ranges and variant counts
      SELECT 
        product_id,
        COUNT(*) as variants_count,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM product_variants
      GROUP BY product_id
    )
    SELECT 
      p.id, 
      p.name, 
      p.slug, 
      p.description, 
      COALESCE(vs.min_price, 0) as "price",
      p.gst_rate,
      p.category_id as "categoryId",
      c.name as "categoryName",
      p.status,
      p.is_new as "isNew",
      p.is_customer_favourites as "isCustomerFavourites", 
      p.is_best_seller as "isBestseller",
      p.images, -- Full array for detail views, or use p.images[1] for list
      p.weight,
      -- Aggregated Stock from CTE
      COALESCE(inv.total_stock, 0) as "stock",
      -- Aggregated Variant Info from CTE
      COALESCE(vs.variants_count, 0) as "variantsCount",
      COALESCE(vs.min_price, 0) as "minPriceAt",
      -- Timestamps
      p.created_at AS "createdAt", 
      p.updated_at AS "updatedAt"
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN InventoryStats inv ON p.id = inv.product_id
    LEFT JOIN VariantStats vs ON p.id = vs.product_id
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT :limit OFFSET :offset
  `;
  const replacements = {
    ...Object.fromEntries(params.map((v, i) => [`param${i}`, v])),
    limit,
    offset,
  };
  return executeSelect<ProductRow>(query, replacements);
};

/**
 * Find single product by ID
 */
export const findById = async (id: string): Promise<ProductRow | null> => {
  const query = `
    SELECT 
      p.id, 
      p.name, 
      p.slug, 
      p.description,
      p."discounted_price" as "discountedPrice",
      p."benefits",
      p."ingredients",
      p."nutrition_facts" as "nutritionFacts",
      p."discounted_percent" as "discountedPercent",
      p.sku,
      p.weight,
      p."gst_rate" as "gst_rate",
      p.category_id as category,
      p.status, 
      p.images,
      p.is_new as "isNew",
      p.is_customer_favourites as "isCustomerFavourites",
      p.is_best_seller as "isBestseller",
      p."created_at" AS "createdAt", 
      p."updated_at" AS "updatedAt",
      ct.name as "categoryName",
      -- Use SUM to get overall stock across all sellers/inventory entries
      COALESCE(SUM(i2.available_stock), 0) AS "stock"
    FROM products p
    LEFT JOIN "categories" ct ON ct.id = p.category_id
    LEFT JOIN "seller_products" sp ON sp.product_id = p.id
    LEFT JOIN "inventory" i2 ON i2.product_id = p.id
    WHERE p.id = ? AND p.deleted_at IS NULL
    GROUP BY 
      p.id, ct.name
  `;

  const result = await executeSelect<ProductRow>(query, [id]);
  return result[0] || null;
};

export const getProductVariants = async (productId: string, transaction?: any) => {
  const query = `
    SELECT 
      id, 
      product_id as "productId", 
      sku, 
      price, 
      discounted_price as "discountedPrice",
      discounted_percent as "discountedPercent",
      weight, 
      weight_unit as "weightUnit",
      status,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM product_variants
    WHERE product_id = ?
    ORDER BY created_at ASC
  `;
  return await executeSelect<any>(query, [productId], transaction);
};

/**
 * Get product variants count
 * Enterprise-grade optimization for list views
 */
export const getProductVariantsCount = async (
  productId: string,
): Promise<number> => {
  const query = `
    SELECT COUNT(*) as count
    FROM product_variants
    WHERE product_id = ?
  `;
  const result = await executeSelect<{ count: string }>(query, [productId]);
  return parseInt(result[0]?.count || "0", 10);
};

export const deleteProductVariantsByProduct = async (productId: string, transaction?: any) => {
  const query = `DELETE FROM product_variants WHERE product_id = ?`;
  await executeModify(query, [productId], transaction);
  return true;
};

export const createProductVariants = async (
  productId: string,
  productName: string,
  variants: any[],
  transaction?: any,
) => {
  if (!Array.isArray(variants) || variants.length === 0) return [];

  const values = variants
    .filter((v) => v && v.price !== undefined && v.price !== null)
    .map((v) => [
      randomUUID(), // Generate UUID for id
      productId,
      v.sku || generateSku(productName, v.weight), // Auto-generate SKU if not provided
      Number(v.price),
      v.discountedPrice !== undefined ? Number(v.discountedPrice) : null,
      v.discountedPercent !== undefined ? Number(v.discountedPercent) : null,
      v.weight !== undefined ? Number(v.weight) : null,
      v.weightUnit || "G",
      v.status || "ACTIVE",
      new Date(),
      new Date(),
    ]);

  if (values.length === 0) return [];

  const query = `
    INSERT INTO product_variants
      (id, product_id, sku, price, discounted_price, discounted_percent, weight, weight_unit, status, created_at, updated_at)
    VALUES
      ${values.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ")}
  `;

  await executeModify(query, values.flat(), transaction);
  return getProductVariants(productId, transaction);
};

/**
 * Update existing product variant
 */
export const updateProductVariant = async (variantId: string, updates: any, transaction?: any) => {
  const entries = Object.entries(updates);
  if (entries.length === 0) return true;

  const mappedEntries = entries.map(([key, val]) => {
    let finalKey = key;
    let finalValue = val;

    // 1. Handle Numeric Conversions
    const numericFields = [
      "price",
      "discountedPrice",
      "discountedPercent",
      "weight",
    ];
    if (numericFields.includes(key) && typeof val === "string") {
      finalValue = Number(val);
    }

    // 2. Handle Key Transformation (CamelCase to snake_case)
    if (key === "weightUnit") {
      finalKey = "weight_unit";
    }

    if (key === "discountedPrice") {
      finalKey = "discounted_price";
    }

    if (key === "discountedPercent") {
      finalKey = "discounted_percent";
    }

    // Return the potentially modified key and value
    return [finalKey, finalValue];
  });

  const setClauses = mappedEntries.map(([key]) => `"${key}" = ?`).join(", ");
  const values = [
    ...mappedEntries.map(([, val]) => val),
    new Date(),
    variantId,
  ];

  const query = `
    UPDATE product_variants
    SET ${setClauses}, updated_at = ?
    WHERE id = ?
  `;

  await executeModify(query, values, transaction);
  return true;
};

/**
 * Create or update product variants intelligently
 * This is the professional way to handle variant updates
 */
export const upsertProductVariants = async (
  productId: string,
  variants: any[],
  transaction?: any,
) => {
  if (!Array.isArray(variants) || variants.length === 0) return [];

  // Get product name for SKU generation
  const product = await findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }
  const productName = product.name;

  const existingVariants = await getProductVariants(productId, transaction);
  const existingVariantMap = new Map(existingVariants.map((v) => [v.id, v]));

  const results = [];

  for (const variant of variants) {
    if (variant.id && existingVariantMap.has(variant.id)) {
      // Update existing variant
      const updates: any = {};
      if (variant.sku !== undefined) updates.sku = variant.sku;
      if (variant.price !== undefined) updates.price = variant.price;
      if (variant.discountedPrice !== undefined)
        updates.discountedPrice = variant.discountedPrice;
      if (variant.discountedPercent !== undefined)
        updates.discountedPercent = variant.discountedPercent;
      if (variant.weight !== undefined) updates.weight = variant.weight;
      if (variant.weightUnit !== undefined)
        updates.weightUnit = variant.weightUnit;
      if (variant.status !== undefined) updates.status = variant.status;

      await updateProductVariant(variant.id, updates, transaction);
      results.push({ ...existingVariantMap.get(variant.id), ...updates });
    } else {
      // Create new variant - remove ID if present and auto-generate SKU if needed
      const { id, createdAt, updatedAt, ...variantData } = variant;
      if (!variantData.sku) {
        const weightInfo = variantData.weight
          ? `${variantData.weight}${variantData.weightUnit || "G"}`
          : "";
        variantData.sku = generateSku(productName, weightInfo);
      }
      const newVariants = await createProductVariants(productId, productName, [
        variantData,
      ], transaction);
      results.push(...newVariants);
    }
  }

  return results;
};

/**
 * Check if product exists
 */
export const exists = async (id: string): Promise<boolean> => {
  const query = "SELECT 1 FROM products WHERE id = ? AND deleted_at IS NULL";
  const result = await executeSelect<{ 1: number }>(query, [id]);
  return result.length > 0;
};

/**
 * Update product fields atomically
 */
export const updateFields = async (
  id: string,
  updates: Record<string, any>,
  transaction?: any,
): Promise<boolean> => {
  const entries = Object.entries(updates);
  if (entries.length === 0) return true;

  // Map model property names to database column names
  // Updated Mapping: Front-end Key -> Database Column Name
  const columnMapping: Record<string, string> = {
    // Added
    discountedPrice: "discounted_price", // Added
    discountedPercent: "discounted_percent", // Added
    category: "category_id",
    gst_rate: "gst_rate",
    isNew: "is_new",
    isCustomerFavourites: "is_customer_favourites",
    isBestseller: "is_best_seller",
    // Existing mappings
    // 'name', 'description', 'status' map 1:1, so fallback handles them
  };

  // Inside updateFields function
  const mappedEntries = entries.map(([key, val]) => {
    const dbColumn = columnMapping[key] || key;
    let finalValue = val;

    // Fix: Convert number to string for the ENUM column
    if (dbColumn === "gst_rate" && typeof val === "number") {
      finalValue = String(val);
    }

    return [dbColumn, finalValue];
  });

  // Rest of your logic remains the same...

  const values = [...mappedEntries.map(([, val]) => val), new Date(), id];

  const setClauses = mappedEntries.map(([key]) => `"${key}" = ?`).join(", ");

  const query = `
    UPDATE products
    SET ${setClauses}, updated_at = ?
    WHERE id = ?
  `;

  await executeModify(query, values, transaction);
  return true;
};

/**
 * Update product status (ACTIVE/INACTIVE)
 */
export const updateStatus = async (
  id: string,
  status: "ACTIVE" | "INACTIVE",
  transaction?: any,
): Promise<boolean> => {
  const query = `
    UPDATE products
    SET status = ?, updated_at = ?
    WHERE id = ? AND deleted_at IS NULL
  `;

  // order: status -> ?, updated_at -> ?, id -> ?
  await executeModify(query, [status, new Date(), id], transaction);
  return true;
};

/**
 * Soft delete product
 */
export const softDelete = async (id: string, transaction?: any): Promise<boolean> => {
  const query = "UPDATE products SET deleted_at = ? WHERE id = ?";
  await executeModify(query, [new Date(), id], transaction);
  return true;
};

/**
 * Update JSONB metadata field
 */
export const updateMetadata = async (
  id: string,
  key: string,
  value: any,
  transaction?: any,
): Promise<boolean> => {
  const query = `
    UPDATE products
    SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), $1::text[], $2::jsonb),
        updated_at = $3
    WHERE id = $4 AND deleted_at IS NULL
  `;
  await executeModify(query, [
    `{${key}}`,
    JSON.stringify(value),
    new Date(),
    id,
  ], transaction);
  return true;
};

/**
 * Remove JSONB metadata field
 */
export const removeMetadata = async (
  id: string,
  key: string,
  transaction?: any,
): Promise<boolean> => {
  const query = `
    UPDATE products
    SET metadata = CASE 
      WHEN metadata IS NOT NULL THEN metadata - $1
      ELSE NULL
    END,
    updated_at = $2
    WHERE id = $3 AND deleted_at IS NULL
  `;
  await executeModify(query, [key, new Date(), id], transaction);
  return true;
};
