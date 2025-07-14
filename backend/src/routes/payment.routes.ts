import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /payments/create-payment-intent:
 *   post:
 *     summary: Creates a new payment intent.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               customerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: The client secret for the payment intent.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Server error.
 */
router.post(
  '/create-payment-intent',
  authMiddleware.protect,
  paymentController.createPaymentIntent
);

/**
 * @swagger
 * /payments/process-payment/{leaseId}:
 *   post:
 *     summary: Processes a payment for a lease.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Server error.
 */
router.post(
  '/process-payment/:leaseId',
  authMiddleware.protect,
  paymentController.processPayment
);

export default router;
