/**
 * Category Database Repository
 * Centralized data access layer with type safety
 */

import { sequelize } from '../../../db/sequelize';
import { QueryTypes } from 'sequelize';
import logger from '../../../utils/logger';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategoryId?: string;
  image?: string;
  isActive: boolean;
  displayOrder: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface CountRow {
  count: string;
}

const executeSelect = async <T>(
  query: string,
  replacements: any = {}
): Promise<T[]> => {
  try {
    const result = (await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
      logging(sql, timing) {
        logger.debug('Database SELECT query', { sql, timing });
      },
    })) as T[];
    return result || [];
  } catch (error: any) {
    logger.error('Database SELECT failed', { query, replacements, error });
    throw error;
  }
};

const executeModify = async (
  query: string,
  replacements: any = {}
): Promise<number> => {
  try {
    await sequelize.query(query, {
      replacements,
      logging(sql, timing) {
        logger.debug('Database MODIFY query', { sql, timing });
      },
    });
    return 1;
  } catch (error: any) {
    logger.error('Database MODIFY failed', { query, replacements, error });
    throw error;
  }
};

export const getCategoryCount = async (
  whereClause: string = '1=1',
  params: Record<string, any> = {}
): Promise<number> => {
  const query = `SELECT COUNT(*) as count FROM categories WHERE ${whereClause}`;
  const result = await executeSelect<CountRow>(query, params);
  return parseInt(result[0]?.count || '0', 10);
};

export const findCategories = async (
  whereClause: string = '1=1',
  params: Record<string, any> = {},
  sortBy: string = 'name',
  sortOrder: string = 'asc',
  limit: number = 10,
  offset: number = 0
): Promise<CategoryRow[]> => {
  const query = `
    SELECT 
      id, 
      name, 
      slug, 
      description,
      parent_category_id as "parentCategoryId",
      image,
      is_active as "isActive",
      -- display_order as "displayOrder",
      metadata,
      created_at as "createdAt", 
      updated_at as "updatedAt"
    FROM categories
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT :limit OFFSET :offset
  `;
  
  return executeSelect<CategoryRow>(query, { ...params, limit, offset });
};

export const findCategoryById = async (id: string): Promise<CategoryRow | null> => {
  const query = `
    SELECT 
      id, name, slug, description,
      parent_category_id as "parentCategoryId",
      image,
      is_active as "isActive",
      display_order as "displayOrder",
      metadata,
      created_at as "createdAt", 
      updated_at as "updatedAt"
    FROM categories
    WHERE id = :id AND deleted_at IS NULL
  `;
  const result = await executeSelect<CategoryRow>(query, { id });
  return result[0] || null;
};

export const findCategoryBySlug = async (slug: string): Promise<CategoryRow | null> => {
  const query = `
    SELECT 
      id, name, slug, description,
      parent_category_id as "parentCategoryId",
      image,
      is_active as "isActive",
      display_order as "displayOrder",
      metadata,
      created_at as "createdAt", 
      updated_at as "updatedAt"
    FROM categories
    WHERE slug = :slug AND deleted_at IS NULL
  `;
  const result = await executeSelect<CategoryRow>(query, { slug });
  return result[0] || null;
};

export const createCategory = async (
  data: {
    name: string;
    slug: string;
    description?: string;
    parentCategoryId?: string;
    image?: string;
    isActive?: boolean;
    displayOrder?: number;
    metadata?: Record<string, any>;
  }
): Promise<CategoryRow> => {
  const query = `
    INSERT INTO categories 
    (id, name, slug, description, parent_category_id, image, is_active, display_order, metadata, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), :name, :slug, :description, :parentCategoryId, :image, :isActive, :displayOrder, :metadata, NOW(), NOW())
    RETURNING 
      id, name, slug, description,
      parent_category_id as "parentCategoryId",
      image,
      is_active as "isActive",
      display_order as "displayOrder",
      metadata,
      created_at as "createdAt", 
      updated_at as "updatedAt"
  `;

  const result = await executeSelect<CategoryRow>(query, {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    parentCategoryId: data.parentCategoryId || null,
    image: data.image || null,
    isActive: data.isActive !== false,
    displayOrder: data.displayOrder || 0,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  });

  return result[0];
};

export const updateCategory = async (
  id: string,
  data: Record<string, any>
): Promise<boolean> => {
  const entries = Object.entries(data).filter(([, val]) => val !== undefined);
  if (entries.length === 0) return true;

  const columnMapping: Record<string, string> = {
    parentCategoryId: 'parent_category_id',
    isActive: 'is_active',
    displayOrder: 'display_order',
  };

  const setClauses = entries
    .map(([key], idx) => {
      const col = columnMapping[key] || key;
      return `"${col}" = :val${idx}`;
    })
    .join(', ');

  const replacements: Record<string, any> = { id };
  entries.forEach(([key, val], idx) => {
    replacements[`val${idx}`] = key === 'metadata' ? JSON.stringify(val) : val;
  });

  const query = `
    UPDATE categories
    SET ${setClauses}, updated_at = NOW()
    WHERE id = :id AND deleted_at IS NULL
  `;

  await executeModify(query, replacements);
  return true;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  const query = 'UPDATE categories SET deleted_at = NOW() WHERE id = :id';
  await executeModify(query, { id });
  return true;
};

export const checkSlugExists = async (slug: string, excludeId?: string): Promise<boolean> => {
  const excludeClause = excludeId ? 'AND id != :excludeId' : '';
  const query = `
    SELECT 1 FROM categories 
    WHERE slug = :slug AND deleted_at IS NULL ${excludeClause}
  `;
  const params: Record<string, any> = { slug };
  if (excludeId) params.excludeId = excludeId;
  
  const result = await executeSelect<{ 1: number }>(query, params);
  return result.length > 0;
};
