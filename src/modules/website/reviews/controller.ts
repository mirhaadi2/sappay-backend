import { Request, Response, NextFunction } from "express";
import { reviewService, CreateReviewData } from "./service";
import { AppError } from "../../../utils/AppError";


export const createReview = async (req: Request, res: Response, next: NextFunction) => {
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
};

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customerId = (req as any).customer?.id;
        const filters = {
            customerId: req.query.customerId as string || customerId,
            productId: req.query.productId as string,
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
};

export const getReviewById = async (req: Request, res: Response, next: NextFunction) => {
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
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
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
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
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
};

export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
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
};

export const checkCanReview = async (req: Request, res: Response, next: NextFunction) => {
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
};
