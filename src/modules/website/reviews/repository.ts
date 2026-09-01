import { Transaction } from 'sequelize';
import { sequelize } from '../../../db/sequelize';
import { Order } from '../../admin/orders/order.model';
import { OrderItem } from '../../admin/orders/order-item.model';
import { Customer } from '../guests/customer.model';
import { Product } from '../../admin/products/model';
import { Review } from './model';
import { ReviewFilters } from './types';

export const findOrderByIdRecord = async (orderId: string, transaction?: Transaction) => {
    return Order.findByPk(orderId, { transaction });
};

export const findOrderItemByIdRecord = async (orderItemId: string, transaction?: Transaction) => {
    return OrderItem.findByPk(orderItemId, { transaction });
};

export const findOrderItemForReviewRecord = async (orderItemId: string) => {
    return OrderItem.findByPk(orderItemId);
};

export const findOrderForReviewRecord = async (orderId: string) => {
    return Order.findByPk(orderId);
};

export const findExistingReviewByOrderItemRecord = async (
    orderItemId: string,
    transaction?: Transaction,
) => {
    return Review.findOne({
        where: { orderItemId },
        transaction,
    });
};

export const createReviewRecord = async (
    data: {
        customerId: string;
        orderId: string;
        orderItemId: string;
        productId: string;
        rating: number;
        comment?: string;
        isVerified?: boolean;
    },
    transaction?: Transaction,
) => {
    return Review.create(
        {
            ...data,
            isVerified: data.isVerified ?? true,
        },
        { transaction },
    );
};

export const findReviewsWithFiltersRecord = async (filters: ReviewFilters = {}) => {
    const { limit = 10, offset = 0, ...whereClause } = filters;

    return Review.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'email'],
            },
            {
                model: Order,
                as: 'order',
                attributes: ['id', 'orderNumber', 'status'],
            },
        ],
    });
};

export const findReviewByIdRecord = async (id: string, transaction?: Transaction) => {
    return Review.findByPk(id, {
        transaction,
        include: [
            {
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'email'],
            },
            {
                model: Order,
                as: 'order',
                attributes: ['id', 'orderNumber', 'status'],
            },
        ],
    });
};

export const updateReviewRecord = async (
    id: string,
    updates: Partial<{
        customerId: string;
        orderId: string;
        orderItemId: string;
        productId: string;
        rating: number;
        comment?: string;
        isVerified: boolean;
    }>,
    transaction?: Transaction,
) => {
    const review = await Review.findByPk(id, { transaction });
    if (!review) throw new Error('Review not found');

    return review.update(updates, { transaction });
};

export const deleteReviewRecord = async (id: string, transaction?: Transaction) => {
    const review = await Review.findByPk(id, { transaction });
    if (!review) throw new Error('Review not found');

    await review.destroy({ transaction });
    return review;
};

export const findProductByIdOrSlugRecord = async (productId: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(productId);

    if (isUuid) {
        return Product.findByPk(productId, {
            attributes: ['id', 'slug', 'rating', 'ratingCount'],
            raw: true,
        });
    }

    return Product.findOne({
        where: { slug: productId },
        attributes: ['id', 'slug', 'rating', 'ratingCount'],
        raw: true,
    });
};

export const findProductRatingStatsRecord = async (
    productId: string,
    transaction?: Transaction,
) => {
    return Review.findAll({
        where: { productId },
        attributes: [
            [sequelize.fn('COUNT', sequelize.col('rating')), 'total'],
            [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
            [
                sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 5 THEN 1 END')),
                'five_star',
            ],
            [
                sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 4 THEN 1 END')),
                'four_star',
            ],
            [
                sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 3 THEN 1 END')),
                'three_star',
            ],
            [
                sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 2 THEN 1 END')),
                'two_star',
            ],
            [
                sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 1 THEN 1 END')),
                'one_star',
            ],
        ],
        raw: true,
        transaction,
    });
};

export const updateProductRatingRecord = async (productId: string, transaction?: Transaction) => {
    const ratingStats = await findProductRatingStatsRecord(productId, transaction);
    const stats = ratingStats[0] as any;
    const totalReviews = Number.parseInt(stats?.total ?? '0', 10) || 0;
    const averageRating = Number.parseFloat(stats?.average ?? '0') || 0;

    await Product.update(
        {
            rating: averageRating,
            ratingCount: totalReviews,
        },
        {
            where: { id: productId },
            transaction,
        },
    );
};

export const findReviewByOrderItemRecord = async (orderItemId: string) => {
    return Review.findOne({
        where: { orderItemId },
        include: [
            {
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'email'],
            },
            {
                model: Order,
                as: 'order',
                attributes: ['id', 'orderNumber', 'status'],
            },
        ],
    });
};
