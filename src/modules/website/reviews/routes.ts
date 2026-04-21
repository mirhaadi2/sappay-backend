import { Router } from "express";
import { 
  getProductReviews, 
  getReviewById, 
  getReviews, 
  createReview, 
  updateReview, 
  deleteReview, 
  checkCanReview 
} from "./controller";
import { requireAuth } from "../../../middleware/auth.middleware";

const router = Router();

// Public GET endpoints - no authentication required
// Note: Specific routes must come BEFORE generic routes
router.get("/products/:productId", getProductReviews);
router.get("/:id", getReviewById);
router.get("/", getReviews);

// Protected endpoints - authentication required
router.post("/", requireAuth, createReview);
router.put("/:id", requireAuth, updateReview);
router.delete("/:id", requireAuth, deleteReview);
router.get("/check/:orderItemId", requireAuth, checkCanReview);

export { router as reviewRoutes };