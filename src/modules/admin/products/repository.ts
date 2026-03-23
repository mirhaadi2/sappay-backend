/**
 * Product Database Repository
 * Centralized data access layer with type safety
 */

import { sequelize } from '../../../db/sequelize';
import { ProductRow, CountRow } from './database.types';
import { QueryTypes } from 'sequelize';
import logger from '../../../utils/logger';
import { AppError } from '../../../utils/AppError';

class ProductRepository {
  /**
   * Execute parameterized SELECT query with type safety
   */
  private async executeSelect<T>(
    query: string,
    replacements: any[] = []
  ): Promise<T[]> {
    try {
      const result = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT,
      }) as T[];
      return result || [];
    } catch (error) {
      logger.error('Database SELECT query failed', { query, error });
      throw error;
    }
  }

  /**
   * Execute parameterized UPDATE/DELETE query
   */
  private async executeModify(
    query: string,
    replacements: any[] = []
  ): Promise<number> {
    try {
      await sequelize.query(query, { replacements });
      return 1;
    } catch (error) {
      logger.error('Database MODIFY query failed', { query, error });
      throw error;
    }
  }

  /**
   * Get product count with optional WHERE conditions
   */
  async getProductCount(whereClause: string, params: any[] = []): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM products p WHERE ${whereClause}`;
    const result = await this.executeSelect<CountRow>(query, params);
    return parseInt(result[0]?.count || '0', 10);
  }

  /**
   * Find products with pagination and filtering
   */
  async findProducts(
    whereClause: string,
    params: any[],
    sortBy: string,
    sortOrder: string,
    limit: number,
    offset: number
  ): Promise<ProductRow[]> {
    const query = `
      SELECT 
        p.id, p.name, p.slug, p.description,
        p."basePrice" as price, p."categoryId" as category,
        p.status, p.images, p."createdAt", p."updatedAt"
      FROM products p
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;
    return this.executeSelect<ProductRow>(query, [...params, limit, offset]);
  }

  /**
   * Find single product by ID
   */
  async findById(id: string): Promise<ProductRow | null> {
    const query = `
      SELECT 
        id, name, slug, description,
        "basePrice" as price, "categoryId" as category,
        status, images, "createdAt", "updatedAt"
      FROM products
      WHERE id = $1 AND "deletedAt" IS NULL
    `;
    const result = await this.executeSelect<ProductRow>(query, [id]);
    return result[0] || null;
  }

  /**
   * Check if product exists
   */
  async exists(id: string): Promise<boolean> {
    const query = 'SELECT 1 FROM products WHERE id = $1 AND "deletedAt" IS NULL';
    const result = await this.executeSelect<{ 1: number }>(query, [id]);
    return result.length > 0;
  }

  /**
   * Update product fields atomically
   */
  async updateFields(id: string, updates: Record<string, any>): Promise<boolean> {
    const entries = Object.entries(updates);
    if (entries.length === 0) return true;

    const setClauses = entries.map(
      ([key], idx) => `"${key}" = $${idx + 1}`
    ).join(', ');
    const values = [...entries.map(([, val]) => val), new Date(), id];

    const query = `
      UPDATE products
      SET ${setClauses}, "updatedAt" = $${entries.length + 1}
      WHERE id = $${entries.length + 2}
    `;
    
    await this.executeModify(query, values);
    return true;
  }

  /**
   * Update product status (ACTIVE/INACTIVE)
   */
  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<boolean> {
    const query = `
      UPDATE products
      SET status = $1, "updatedAt" = $2
      WHERE id = $3 AND "deletedAt" IS NULL
    `;
    await this.executeModify(query, [status, new Date(), id]);
    return true;
  }

  /**
   * Soft delete product
   */
  async softDelete(id: string): Promise<boolean> {
    const query = 'UPDATE products SET "deletedAt" = $1 WHERE id = $2';
    await this.executeModify(query, [new Date(), id]);
    return true;
  }

  /**
   * Update JSONB metadata field
   */
  async updateMetadata(id: string, key: string, value: any): Promise<boolean> {
    const query = `
      UPDATE products
      SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), $1::text[], $2::jsonb),
          "updatedAt" = $3
      WHERE id = $4 AND "deletedAt" IS NULL
    `;
    await this.executeModify(query, [`{${key}}`, JSON.stringify(value), new Date(), id]);
    return true;
  }

  /**
   * Remove JSONB metadata field
   */
  async removeMetadata(id: string, key: string): Promise<boolean> {
    const query = `
      UPDATE products
      SET metadata = CASE 
        WHEN metadata IS NOT NULL THEN metadata - $1
        ELSE NULL
      END,
      "updatedAt" = $2
      WHERE id = $3 AND "deletedAt" IS NULL
    `;
    await this.executeModify(query, [key, new Date(), id]);
    return true;
  }
}

export const productRepository = new ProductRepository();
