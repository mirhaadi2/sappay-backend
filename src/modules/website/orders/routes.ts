import { Router } from 'express';
import {
  placeOrderHandler,
  getOrdersHandler,
  confirmPaymentHandler,
  cancelOrderHandler,
  getSellerOrdersHandler,
  updateItemStatusHandler,
} from './controller';

const router = Router();

// Customer endpoints
router.post('/', placeOrderHandler);
router.get('/', getOrdersHandler);
router.post('/:id/confirm-payment', confirmPaymentHandler);
router.post('/:id/cancel', cancelOrderHandler);

// Seller endpoints
router.get('/seller/orders', getSellerOrdersHandler);
router.put('/:itemId/status', updateItemStatusHandler);

export default router;
