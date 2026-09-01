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
    updateProductImages,
    getSellerOfferingsCount,
    getSellerOfferings,
} from './repository';
import {
    createProductService,
    generateProductVariantsWithSku,
    invalidateProductsCache,
} from '../../website/products/service';
import { findProductBySku, findProductVariantBySku } from '../../website/products/repository';

import {
    requireProductExists,
    validateUpdateData,
    validatePaginationParams,
    validateFilterParams,
    handleServiceError,
    validateProductImages,
    compareProductImages,
} from './guards';
import {
    transformProductToAdmin,
    transformProductsToAdmin,
    buildWhereClause,
    resolveSortColumn,
} from './transformer';
import { AdminProductQuery, AdminProduct } from './types';
import { calculatePagination, buildPaginatedResponse } from '../../shared/pagination';
import logger from '../../../utils/logger';
import { SellerProduct } from './seller-product/model';
import { Inventory } from '../../sellers/inventory/model';
import { Seller } from '../../sellers/model';
import { withTransaction } from '../../../utils/transaction';
import { AppError } from '../../../utils/AppError';

/**
 * List all products with advanced filtering and pagination
 */
export const adminListProducts = async (
    query: AdminProductQuery,
): Promise<ReturnType<typeof buildPaginatedResponse>> => {
    try {
        const { page, limit, offset } = validatePaginationParams(query.page, query.limit, 100);

        const filters = validateFilterParams(query);
        const { clause: whereClause, params: whereParams } = buildWhereClause(filters);
        const { column: sortColumn, order: sortOrder } = resolveSortColumn(query.sortBy);

        const [total, rows] = await Promise.all([
            getProductCount(whereClause, whereParams),
            findProducts(whereClause, whereParams, sortColumn, sortOrder, limit, offset),
        ]);

        const products = await transformProductsToAdmin(rows);
        return buildPaginatedResponse(products, total, { page, limit, offset });
    } catch (error) {
        handleServiceError(error, 'List products');
    }
};

/**
 * Get single product details
 */

export const adminGetProduct = async (
    id: string,
    sellerOfferingsPage: number = 1,
    sellerOfferingsLimit: number = 10,
): Promise<any> => {
    try {
        await requireProductExists(id, 'Product');
        const product = await findById(id);
        if (!product) {
            throw new Error('Product not found after exists check');
        }

        const variants = await getProductVariants(id);

        const total = await getSellerOfferingsCount(id);
        const offset = (sellerOfferingsPage - 1) * sellerOfferingsLimit;

        const sellerOfferings = await getSellerOfferings(id, sellerOfferingsLimit, offset);

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
        handleServiceError(error, 'Fetch product');
    }
};

/**
 * Update product information
 */
export const adminUpdateProduct = async (id: string, data: any): Promise<any> => {
    return withTransaction(async (transaction) => {
        await requireProductExists(id, 'Product');
        const updates = validateUpdateData(data);

        // Remove unused fields - SKU and pricing now handled at variant level
        if (updates.sku) {
            delete updates.sku;
        }

        const existingVariant = await findProductVariantBySku(updates.sku);
        if (existingVariant) {
            throw new AppError('BadRequest', 400, 'SKU conflicts with existing variant');
        }

        // Remove price/discount fields from main product since they're now handled by variants
        delete updates.price;
        delete updates.discountedPrice;
        delete updates.discountedPercent;
        delete updates.weight;

        // Handle images separately with proper validation and tracking
        const newImages = updates.images;
        if (newImages !== undefined) {
            const validatedImages = validateProductImages(newImages);
            const imageUpdateResult = await updateProductImages(id, validatedImages, transaction);

            // Log image changes for audit trail
            if (imageUpdateResult.added.length > 0 || imageUpdateResult.removed.length > 0) {
                logger.info('Product images updated - Audit Trail', {
                    productId: id,
                    previousImageCount: imageUpdateResult.previousImages.length,
                    newImageCount: imageUpdateResult.updatedImages.length,
                    imagesAdded: imageUpdateResult.added.length,
                    imagesRemoved: imageUpdateResult.removed.length,
                    addedDetails: imageUpdateResult.added,
                    removedDetails: imageUpdateResult.removed,
                });
            }

            // Remove from updates object since we handled it separately
            delete updates.images;
        }

        const variantUpdateData = updates.variants;
        delete updates.variants;

        // Update remaining fields (excluding images which we handled separately)
        if (Object.keys(updates).length > 0) {
            await updateFields(id, updates, transaction);
        }

        // Handle variant updates intelligently - only update/create what's provided
        if (Array.isArray(variantUpdateData) && variantUpdateData.length > 0) {
            await upsertProductVariants(id, variantUpdateData, transaction);
        }

        await invalidateProductsCache();

        logger.info('Product updated', { productId: id, fieldsUpdated: Object.keys(updates) });
        return await adminGetProduct(id);
    });
};

/**
 * Delete product (soft delete)
 */
export const adminDeleteProduct = async (id: string): Promise<any> => {
    return withTransaction(async (transaction) => {
        await requireProductExists(id, 'Product');
        await softDelete(id, transaction);

        await invalidateProductsCache();

        logger.info('Product deleted', { productId: id });
        return { success: true, message: 'Product deleted successfully' };
    });
};

/**
 * Publish product
 */
export const adminPublishProduct = async (id: string): Promise<any> => {
    return withTransaction(async (transaction) => {
        await requireProductExists(id, 'Product');
        await updateStatus(id, 'ACTIVE', transaction);

        await invalidateProductsCache();

        logger.info('Product published', { productId: id });
        return await adminGetProduct(id);
    });
};

/**
 * Unpublish product
 */
export const adminUnpublishProduct = async (id: string): Promise<any> => {
    return withTransaction(async (transaction) => {
        await requireProductExists(id, 'Product');
        await updateStatus(id, 'INACTIVE', transaction);

        await invalidateProductsCache();

        logger.info('Product unpublished', { productId: id });
        return await adminGetProduct(id);
    });
};

/**
 * Mark product as featured
 */
export const adminFeatureProduct = async (id: string): Promise<any> => {
    return withTransaction(async (transaction) => {
        await requireProductExists(id, 'Product');
        await updateMetadata(id, 'featured', true, transaction);

        await invalidateProductsCache();

        logger.info('Product featured', { productId: id });
        return await adminGetProduct(id);
    });
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
            benefits,
            ingredients,
            nutritionFacts,
        } = input;

        if (!name || !(categoryId || input.category)) {
            throw new Error('Name and categoryId are required');
        }

        const finalSlug = (slug || name)
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        const productPayload = {
            name,
            description,
            slug: finalSlug,
            categoryId: categoryId || input.category,
            weight: weight !== undefined ? Number(weight) : undefined,
            gst_rate: Number(gst_rate ?? 18),
            status: status && (status === 'ACTIVE' || status === 'INACTIVE') ? status : 'ACTIVE',
            images: images || [],
            variants: Array.isArray(input.variants) ? input.variants : [],
            stock: parseInt(stock) || 0,
            addedBy: addedBy || null,
            isNew: isNew ?? false,
            isCustomerFavourites: isCustomerFavourites ?? false,
            isBestseller: isBestseller ?? false,
            benefits: Array.isArray(benefits) ? benefits : [],
            ingredients: Array.isArray(ingredients) ? ingredients : [],
            nutritionFacts: Array.isArray(nutritionFacts) ? nutritionFacts : [],
        };

        const created = await createProductService(productPayload);

        return created;
    } catch (error) {
        handleServiceError(error, 'Create product');
    }
};

export const adminUnfeatureProduct = async (id: string): Promise<any> => {
    return withTransaction(async (transaction) => {
        await requireProductExists(id, 'Product');
        await removeMetadata(id, 'featured', transaction);

        await invalidateProductsCache();

        logger.info('Product unfeatured', { productId: id });
        return await adminGetProduct(id);
    });
};
