import { withTransaction } from '../../../utils/transaction';
import { Review } from './model';
import { AppError } from '../../../utils/AppError';
import { CreateReviewRequest, ReviewFilters } from './types';
import {
    createReviewRecord,
    deleteReviewRecord,
    findExistingReviewByOrderItemRecord,
    findOrderByIdRecord,
    findOrderForReviewRecord,
    findOrderItemByIdRecord,
    findOrderItemForReviewRecord,
    findProductByIdOrSlugRecord,
    findProductRatingStatsRecord,
    findReviewByIdRecord,
    findReviewByOrderItemRecord,
    findReviewsWithFiltersRecord,
    updateProductRatingRecord,
    updateReviewRecord,
} from './repository';

// Type alias for backward compatibility
export type CreateReviewData = CreateReviewRequest;
// export { ReviewFilters };

/**
 * Create a new review
 */
export const createReview = async (data: CreateReviewData): Promise<Review> => {
    return withTransaction(async (transaction) => {
        // Validate rating
        if (data.rating < 1 || data.rating > 5) {
            throw new AppError('ValidationError', 400, 'Rating must be between 1 and 5');
        }

        // Check if order exists and is delivered
        const order = await findOrderByIdRecord(data.orderId, transaction);
        if (!order) {
            throw new AppError('NotFound', 404, 'Order not found');
        }

        if (order.status !== 'DELIVERED') {
            throw new AppError('ValidationError', 400, 'Can only review delivered orders');
        }

        // Check if order belongs to customer
        if (
            order.customerId !== data.customerId &&
            order.guestEmail !== data.customerId &&
            order.guestPhone !== data.customerId
        ) {
            throw new AppError('Forbidden', 403, 'You can only review your own orders');
        }

        // Check if order item exists and belongs to the order
        const orderItem = await findOrderItemByIdRecord(data.orderItemId, transaction);
        if (!orderItem) {
            throw new AppError('NotFound', 404, 'Order item not found');
        }

        if (orderItem.orderId !== data.orderId) {
            throw new AppError(
                'ValidationError',
                400,
                'Order item does not belong to the specified order',
            );
        }

        if (orderItem.productId !== data.productId) {
            throw new AppError('ValidationError', 400, 'Product ID does not match order item');
        }

        // Check if review already exists for this order item
        const existingReview = await findExistingReviewByOrderItemRecord(
            data.orderItemId,
            transaction,
        );

        if (existingReview) {
            throw new AppError('Conflict', 409, 'Review already exists for this order item');
        }

        // Create the review
        const review = await createReviewRecord(
            {
                ...data,
                isVerified: true,
            },
            transaction,
        );

        await updateProductRatingRecord(data.productId, transaction);

        return review;
    });
};

/**
 * Get reviews with filters
 */
export const getReviews = async (
    filters: ReviewFilters = {},
): Promise<{ reviews: Review[]; total: number }> => {
    const { rows: reviews, count: total } = await findReviewsWithFiltersRecord(filters);

    return { reviews, total };
};

/**
 * Get review by ID
 */
export const getReviewById = async (id: string): Promise<Review | null> => {
    return findReviewByIdRecord(id);
};

/**
 * Update a review
 */
export const updateReview = async (
    id: string,
    customerId: string,
    updates: Partial<CreateReviewData>,
): Promise<Review> => {
    return withTransaction(async (transaction) => {
        const review = await findReviewByIdRecord(id, transaction);
        if (!review) {
            throw new AppError('NotFound', 404, 'Review not found');
        }

        if (review.customerId !== customerId) {
            throw new AppError('Forbidden', 403, 'You can only update your own reviews');
        }

        if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
            throw new AppError('ValidationError', 400, 'Rating must be between 1 and 5');
        }

        const updatedReview = await updateReviewRecord(id, updates, transaction);

        if (updates.rating !== undefined) {
            await updateProductRatingRecord(updatedReview.productId, transaction);
        }

        return updatedReview;
    });
};

/**
 * Delete a review
 */
export const deleteReview = async (id: string, customerId: string): Promise<void> => {
    return withTransaction(async (transaction) => {
        const review = await findReviewByIdRecord(id, transaction);
        if (!review) {
            throw new AppError('NotFound', 404, 'Review not found');
        }

        if (review.customerId !== customerId) {
            throw new AppError('Forbidden', 403, 'You can only delete your own reviews');
        }

        await deleteReviewRecord(id, transaction);
        await updateProductRatingRecord(review.productId, transaction);
    });
};

/**
 * Get product reviews with rating statistics
 */
export const getProductReviews = async (
    productId: string,
    page: number = 1,
    limit: number = 10,
) => {
    const offset = (page - 1) * limit;

    const product = await findProductByIdOrSlugRecord(productId);

    if (!product) {
        throw new AppError('NotFound', 404, 'Product not found');
    }

    const { reviews, total } = await getReviews({
        productId: product?.id,
        limit,
        offset,
    });

    // Get rating statistics
    const ratingStats = await findProductRatingStatsRecord(product.id);

    const stats = ratingStats[0] as any;

    return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        statistics: {
            totalReviews: parseInt(stats.total) || 0,
            averageRating: parseFloat(stats.average) || 0,
            ratingDistribution: {
                5: parseInt(stats.five_star) || 0,
                4: parseInt(stats.four_star) || 0,
                3: parseInt(stats.three_star) || 0,
                2: parseInt(stats.two_star) || 0,
                1: parseInt(stats.one_star) || 0,
            },
        },
    };
};

/**
 * Get review by order item ID
 */
export const getReviewByOrderItem = async (orderItemId: string): Promise<Review | null> => {
    return findReviewByOrderItemRecord(orderItemId);
};

/**
 * Check if customer can review an order item
 */
export const canReviewOrderItem = async (
    customerId: string,
    orderItemId: string,
): Promise<boolean> => {
    const orderItem = await findOrderItemForReviewRecord(orderItemId);

    if (!orderItem) return false;

    // Fetch the order separately since association is not defined
    const order = await findOrderForReviewRecord(orderItem.orderId);
    if (!order) return false;

    // Check if order is delivered
    if (order.status !== 'DELIVERED') return false;

    // Check if order belongs to customer
    if (
        order.customerId !== customerId &&
        order.guestEmail !== customerId &&
        order.guestPhone !== customerId
    ) {
        return false;
    }

    const existingReview = await findExistingReviewByOrderItemRecord(orderItemId);

    return !existingReview;
};
