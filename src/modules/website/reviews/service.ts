import { Transaction } from "sequelize";
import { sequelize } from "../../../db/sequelize";
import { withTransaction } from "../../../utils/transaction";
import { Review } from "./model";
import { Order } from "../../admin/orders/order.model";
import { OrderItem } from "../../admin/orders/order-item.model";
import { Customer } from "../guests/customer.model";
import { Product } from "../../admin/products/model";
import { AppError } from "../../../utils/AppError";
import { CreateReviewRequest, ReviewFilters } from './types';

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
      throw new AppError("ValidationError", 400, "Rating must be between 1 and 5");
    }

    // Check if order exists and is delivered
    const order = await Order.findByPk(data.orderId, { transaction });
    if (!order) {
      throw new AppError("NotFound", 404, "Order not found");
    }

    if (order.status !== "DELIVERED") {
      throw new AppError("ValidationError", 400, "Can only review delivered orders");
    }

    // Check if order belongs to customer
    if (order.customerId !== data.customerId && order.guestEmail !== data.customerId && order.guestPhone !== data.customerId) {
      throw new AppError("Forbidden", 403, "You can only review your own orders");
    }

    // Check if order item exists and belongs to the order
    const orderItem = await OrderItem.findByPk(data.orderItemId, { transaction });
    if (!orderItem) {
      throw new AppError("NotFound", 404, "Order item not found");
    }

    if (orderItem.orderId !== data.orderId) {
      throw new AppError("ValidationError", 400, "Order item does not belong to the specified order");
    }

    if (orderItem.productId !== data.productId) {
      throw new AppError("ValidationError", 400, "Product ID does not match order item");
    }

    // Check if review already exists for this order item
    const existingReview = await Review.findOne({
      where: { orderItemId: data.orderItemId },
      transaction,
    });

    if (existingReview) {
      throw new AppError("Conflict", 409, "Review already exists for this order item");
    }

    // Create the review
    const review = await Review.create(
      {
        ...data,
        isVerified: true, // Since we validate the order is delivered and belongs to customer
      },
      { transaction }
    );

    // Update seller product rating aggregation
    await updateProductRating(data.productId, transaction);

    return review;
  });
};

/**
 * Get reviews with filters
 */
export const getReviews = async (filters: ReviewFilters = {}): Promise<{ reviews: Review[]; total: number }> => {
  const { limit = 10, offset = 0, ...whereClause } = filters;

  const { rows: reviews, count: total } = await Review.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "email"],
      },
      {
        model: Order,
        as: "order",
        attributes: ["id", "orderNumber", "status"],
      },
    ],
  });

  return { reviews, total };
};

/**
 * Get review by ID
 */
export const getReviewById = async (id: string): Promise<Review | null> => {
  return Review.findByPk(id, {
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "email"],
      },
      {
        model: Order,
        as: "order",
        attributes: ["id", "orderNumber", "status"],
      },
    ],
  });
};

/**
 * Update a review
 */
export const updateReview = async (id: string, customerId: string, updates: Partial<CreateReviewData>): Promise<Review> => {
  return withTransaction(async (transaction) => {
    const review = await Review.findByPk(id, { transaction });
    if (!review) {
      throw new AppError("NotFound", 404, "Review not found");
    }

    if (review.customerId !== customerId) {
      throw new AppError("Forbidden", 403, "You can only update your own reviews");
    }

    // Validate rating if provided
    if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
      throw new AppError("ValidationError", 400, "Rating must be between 1 and 5");
    }

    await review.update(updates, { transaction });

    // Update seller product rating if rating changed
    if (updates.rating !== undefined) {
      await updateProductRating(review.productId, transaction);
    }

    return review;
  });
};

/**
 * Delete a review
 */
export const deleteReview = async (id: string, customerId: string): Promise<void> => {
  return withTransaction(async (transaction) => {
    const review = await Review.findByPk(id, { transaction });
    if (!review) {
      throw new AppError("NotFound", 404, "Review not found");
    }

    if (review.customerId !== customerId) {
      throw new AppError("Forbidden", 403, "You can only delete your own reviews");
    }

    await review.destroy({ transaction });

    // Update product rating after deletion
    await updateProductRating(review.productId, transaction);
  });
};

/**
 * Get product reviews with rating statistics
 */
export const getProductReviews = async (productId: string, page: number = 1, limit: number = 10) => {
  const offset = (page - 1) * limit;

  const { reviews, total } = await getReviews({
    productId,
    limit,
    offset,
  });

  // Get rating statistics
  const ratingStats = await Review.findAll({
    where: { productId },
    attributes: [
      [sequelize.fn("COUNT", sequelize.col("rating")), "total"],
      [sequelize.fn("AVG", sequelize.col("rating")), "average"],
      [sequelize.fn("COUNT", sequelize.literal("CASE WHEN rating = 5 THEN 1 END")), "five_star"],
      [sequelize.fn("COUNT", sequelize.literal("CASE WHEN rating = 4 THEN 1 END")), "four_star"],
      [sequelize.fn("COUNT", sequelize.literal("CASE WHEN rating = 3 THEN 1 END")), "three_star"],
      [sequelize.fn("COUNT", sequelize.literal("CASE WHEN rating = 2 THEN 1 END")), "two_star"],
      [sequelize.fn("COUNT", sequelize.literal("CASE WHEN rating = 1 THEN 1 END")), "one_star"],
    ],
    raw: true,
  });

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
  const review = await Review.findOne({
    where: { orderItemId },
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "email"],
      },
      {
        model: Order,
        as: "order",
        attributes: ["id", "orderNumber", "status"],
      },
    ],
  });

  return review;
};

/**
 * Check if customer can review an order item
 */
export const canReviewOrderItem = async (customerId: string, orderItemId: string): Promise<boolean> => {
  const orderItem = await OrderItem.findByPk(orderItemId);

  if (!orderItem) return false;

  // Fetch the order separately since association is not defined
  const order = await Order.findByPk(orderItem.orderId);
  if (!order) return false;

  // Check if order is delivered
  if (order.status !== "DELIVERED") return false;

  // Check if order belongs to customer
  if (order.customerId !== customerId && order.guestEmail !== customerId && order.guestPhone !== customerId) {
    return false;
  }

  // Check if review already exists
  const existingReview = await Review.findOne({
    where: { orderItemId },
  });

  return !existingReview;
};

/**
 * Update product rating aggregation
 */
const updateProductRating = async (productId: string, transaction: Transaction): Promise<void> => {
  const ratingStats = await Review.findAll({
    where: { productId },
    attributes: [
      [sequelize.fn("COUNT", sequelize.col("rating")), "total"],
      [sequelize.fn("AVG", sequelize.col("rating")), "average"],
    ],
    raw: true,
    transaction,
  });

  const stats = ratingStats[0] as any;
  const totalReviews = parseInt(stats.total) || 0;
  const averageRating = parseFloat(stats.average) || 0;

  await Product.update(
    {
      rating: averageRating,
      ratingCount: totalReviews,
    },
    {
      where: { id: productId },
      transaction,
    }
  );
};