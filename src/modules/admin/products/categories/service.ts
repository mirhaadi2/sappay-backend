import {
  createCategory,
  deleteCategory,
  findCategoryById,
  findCategories,
  updateCategory,
  getCategoryCount,
  checkSlugExists,
} from './repository';
import { AdminCategoryQuery, AdminCategoryCreateInput, AdminCategoryUpdateInput, AdminCategory } from './types';
import { sequelize } from '../../../../db/sequelize';

const makeSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const adminListCategories = async (query: AdminCategoryQuery): Promise<{
  categories: AdminCategory[];
  total: number;
  page: number;
  limit: number;
}> => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;

  const conditions: string[] = ['deleted_at IS NULL'];
  const params: Record<string, any> = {};

  if (query.search) {
    conditions.push('(name ILIKE :search OR description ILIKE :search)');
    params.search = `%${query.search}%`;
  }

  if (query.isActive !== undefined) {
    conditions.push('is_active = :isActive');
    params.isActive = query.isActive;
  }

  const whereClause = conditions.join(' AND ');
  const categories = await findCategories(whereClause, params, query.sortBy || 'name', query.sortOrder || 'asc', limit, offset);
  const total = await getCategoryCount(whereClause, params);

  return {
    categories: categories as AdminCategory[],
    total,
    page,
    limit,
  };
};

export const adminGetCategory = async (id: string): Promise<AdminCategory> => {
  const category = await findCategoryById(id);
  if (!category) throw { statusCode: 404, message: 'Category not found' };
  return category as AdminCategory;
};

export const adminCreateCategory = async (payload: AdminCategoryCreateInput): Promise<AdminCategory> => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const name = payload.name.trim();
    const slug = payload.slug ? makeSlug(payload.slug) : makeSlug(name);

    if (!name) throw { statusCode: 400, message: 'Category name is required' };

    if (await checkSlugExists(slug)) {
      throw { statusCode: 409, message: 'Category slug already exists' };
    }

    const category = await createCategory({
      name,
      slug,
      description: payload.description,
      parentCategoryId: payload.parentCategoryId,
      image: payload.image,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      displayOrder: payload.displayOrder || 0,
      metadata: payload.metadata || {},
    }, transaction);

    await transaction.commit();
    return category as AdminCategory;
  } catch (error) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        console.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    throw error;
  }
};

export const adminUpdateCategory = async (id: string, payload: AdminCategoryUpdateInput): Promise<AdminCategory> => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    if (payload.slug) {
      const slug = makeSlug(payload.slug);
      if (await checkSlugExists(slug, id)) {
        throw { statusCode: 409, message: 'Category slug already exists' };
      }
      payload.slug = slug;
    }

    await updateCategory(id, payload, transaction);
    const updated = await findCategoryById(id);
    if (!updated) throw { statusCode: 404, message: 'Category not found' };
    
    await transaction.commit();
    return updated as AdminCategory;
  } catch (error) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        console.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    throw error;
  }
};

export const adminDeleteCategory = async (id: string): Promise<boolean> => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    await deleteCategory(id, transaction);
    
    await transaction.commit();
    return true;
  } catch (error) {
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        console.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    throw error;
  }
};
