import { Router } from 'express';
import {
  placeOrderHandler,
  getOrdersHandler,
  confirmPaymentHandler,
  cancelOrderHandler,
  getSellerOrdersHandler,
  updateItemStatusHandler,
  getOrderHandler,
} from './controller';
import { requireAuth } from "../../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

// Customer endpoints
router.post('/', placeOrderHandler);
router.get('/', getOrdersHandler);
router.get('/:id', getOrderHandler); // Get specific order details
router.post('/:id/confirm-payment', confirmPaymentHandler);
router.post('/:id/cancel', cancelOrderHandler);

// Seller endpoints
router.get('/seller/orders', getSellerOrdersHandler);
router.put('/:itemId/status', updateItemStatusHandler);

export default router;
