import { Router } from 'express';
import PaymentController from '../controllers/paymentController';

const router = Router();

router.post('/customers', PaymentController.createCustomer);
router.post('/payment-intents', PaymentController.createPaymentIntent);
router.post('/subscriptions', PaymentController.createSubscription);
router.post('/webhooks', PaymentController.handleWebhook);
router.post('/refunds', PaymentController.createRefund);
router.post('/payment-methods/attach', PaymentController.attachPaymentMethod);
router.get('/customers/:customerId/payment-methods', PaymentController.getCustomerPaymentMethods);
router.post('/setup-intents', PaymentController.createSetupIntent);
router.get('/subscriptions/:subscriptionId', PaymentController.getSubscriptionDetails);
router.post('/subscriptions/:subscriptionId/cancel', PaymentController.cancelSubscription);
router.put('/subscriptions/:subscriptionId', PaymentController.updateSubscription);
router.post('/invoices', PaymentController.createInvoice);
router.post('/customer-portal-session', PaymentController.getCustomerPortalSession);
router.post('/calculate-fees', PaymentController.calculateFees);

export default router;
