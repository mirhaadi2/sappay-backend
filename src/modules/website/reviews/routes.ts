import { Router, Request, Response, NextFunction } from "express";
import { reviewService, CreateReviewData } from "./service";
import { AppError } from "../../../utils/AppError";
import { requireAuth } from "../../../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * POST /api/reviews
 * Create a new review
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.session?.user?.id;
    if (!customerId) {
      throw new AppError("Unauthorized", 401, "Customer not authenticated");
    }

    const reviewData: CreateReviewData = {
      customerId,
      orderId: req.body.orderId,
      orderItemId: req.body.orderItemId,
      productId: req.body.productId,
      rating: req.body.rating,
      comment: req.body.comment,
    };

    // Validate required fields
    if (!reviewData.orderId || !reviewData.orderItemId || !reviewData.productId || !reviewData.rating) {
      throw new AppError("ValidationError", 400, "Missing required fields: orderId, orderItemId, productId, rating");
    }

    const review = await reviewService.createReview(reviewData);

    res.status(201).json({
      success: true,
      data: review,
      message: "Review created successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews
 * Get reviews with optional filters
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = (req as any).customer?.id;
    const filters = {
      customerId: req.query.customerId as string || customerId, // Default to current customer if not specified
      productId: req.query.productId as string,
      sellerProductId: req.query.sellerProductId as string,
      rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await reviewService.getReviews(filters);

    res.json({
      success: true,
      data: result.reviews,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/:id
 * Get a specific review by ID
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await reviewService.getReviewById(req.params.id);

    if (!review) {
      throw new AppError("NotFound", 404, "Review not found");
    }

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/reviews/:id
 * Update a review
 */
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = (req as any).customer?.id;
    if (!customerId) {
      throw new AppError("Unauthorized", 401, "Customer not authenticated");
    }

    const updates: Partial<CreateReviewData> = {
      rating: req.body.rating,
      comment: req.body.comment,
    };

    const review = await reviewService.updateReview(req.params.id, customerId, updates);

    res.json({
      success: true,
      data: review,
      message: "Review updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review
 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = (req as any).customer?.id;
    if (!customerId) {
      throw new AppError("Unauthorized", 401, "Customer not authenticated");
    }

    await reviewService.deleteReview(req.params.id, customerId);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/products/:productId
 * Get reviews for a specific product with statistics
 */
router.get("/products/:productId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await reviewService.getProductReviews(req.params.productId, page, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/check/:orderItemId
 * Check if customer can review an order item
 */
router.get("/check/:orderItemId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = (req as any).customer?.id;
    if (!customerId) {
      throw new AppError("Unauthorized", 401, "Customer not authenticated");
    }

    const canReview = await reviewService.canReviewOrderItem(customerId, req.params.orderItemId);

    res.json({
      success: true,
      data: {
        canReview,
        orderItemId: req.params.orderItemId,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as reviewRoutes };