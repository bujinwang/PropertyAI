import { Router } from 'express';
import { vendorPaymentController } from '../controllers/vendorPayment.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post(
  '/payout',
  authMiddleware.protect,
  authMiddleware.restrictTo('PROPERTY_MANAGER', 'ADMIN'),
  vendorPaymentController.initiatePayment
);

router.get(
  '/history/:vendorId',
  authMiddleware.protect,
  authMiddleware.restrictTo('VENDOR', 'PROPERTY_MANAGER', 'ADMIN'),
  vendorPaymentController.getPaymentHistory
);

router.post('/stripe-webhooks', vendorPaymentController.handleStripeWebhook);

export default router;