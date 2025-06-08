import { Router } from 'express';
import PaymentController from '../controllers/paymentController';

const router = Router();

router.post('/customers', PaymentController.createCustomer);
router.post('/payment-intents', PaymentController.createPaymentIntent);
router.post('/subscriptions', PaymentController.createSubscription);
router.post('/webhooks', PaymentController.handleWebhook);

export default router;
