/**
 * Product Database Repository
 * Centralized data access layer with type safety
 * Functional approach for simplicity and composability
 */

import { sequelize } from "../../../db/sequelize";
import { ProductRow, CountRow } from "./database.types";
import { QueryTypes } from "sequelize";
import logger from "../../../utils/logger";

/**
 * Execute parameterized SELECT query with type safety
 */
const executeSelect = async <T>(
  query: string,
  replacements: any = [],
): Promise<T[]> => {
  var timing = 0;
  try {
    const result = (await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
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
): Promise<number> => {
  var timing = 0;
  try {
    await sequelize.query(query, {
      replacements,
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
    SELECT 
      p.id, 
      p.name, 
      p.slug, 
      p.description,
      p."base_price" as price, 
      p."discounted_price" as "discountedPrice",
      p."discounted_percent" as "discountedPercent",
      p."gst_rate" as "gst_rate",
      p."category_id" as category,
      p.status, 
      p.images,
      p."created_at" AS "createdAt", 
      p."updated_at" AS "updatedAt",
      i.available_stock as "stock"
    FROM products p
    LEFT JOIN "seller_products" sp ON sp.product_id = p.id
    LEFT JOIN "inventory" i ON sp.id = i.seller_product_id
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
      p."base_price" as price, 
      p."discounted_price" as "discountedPrice",
      p."discounted_percent" as "discountedPercent",
      p."gst_rate" as "gst_rate",
      p.category_id as category,
      p.status, 
      p.images, 
      p."created_at" AS "createdAt", 
      p."updated_at" AS "updatedAt",
      ct.name as "categoryName",
      i.available_stock as "stock"
    FROM products p
    LEFT JOIN "categories" ct ON ct.id = p.category_id
    LEFT JOIN "seller_products" sp ON sp.product_id = p.id
    LEFT JOIN "inventory" i ON sp.id = i.seller_product_id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `;
  // The 'id' in this array maps to the '?' above
  const result = await executeSelect<ProductRow>(query, [id]);
  return result[0] || null;
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
): Promise<boolean> => {
  const entries = Object.entries(updates);
  if (entries.length === 0) return true;

  // Map model property names to database column names
  // Updated Mapping: Front-end Key -> Database Column Name
  const columnMapping: Record<string, string> = {
    price: "base_price", // Added
    discountedPrice: "discounted_price", // Added
    discountedPercent: "discounted_percent", // Added
    category: "category_id",
    gst_rate: "gst_rate",
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

  await executeModify(query, values);
  return true;
};

/**
 * Update product status (ACTIVE/INACTIVE)
 */
export const updateStatus = async (
  id: string,
  status: "ACTIVE" | "INACTIVE",
): Promise<boolean> => {
  const query = `
    UPDATE products
    SET status = ?, updated_at = ?
    WHERE id = ? AND deleted_at IS NULL
  `;

  // order: status -> ?, updated_at -> ?, id -> ?
  await executeModify(query, [status, new Date(), id]);
  return true;
};

/**
 * Soft delete product
 */
export const softDelete = async (id: string): Promise<boolean> => {
  const query = "UPDATE products SET deleted_at = $1 WHERE id = $2";
  await executeModify(query, [new Date(), id]);
  return true;
};

/**
 * Update JSONB metadata field
 */
export const updateMetadata = async (
  id: string,
  key: string,
  value: any,
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
  ]);
  return true;
};

/**
 * Remove JSONB metadata field
 */
export const removeMetadata = async (
  id: string,
  key: string,
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
  await executeModify(query, [key, new Date(), id]);
  return true;
};
