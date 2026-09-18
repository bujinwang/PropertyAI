import { Router, RequestHandler } from 'express';
import { UserRole } from '@prisma/client';
import PaymentController from '../controllers/paymentController';
import { isAuthenticated, checkRole } from '../middleware/auth';

const router = Router();

/**
 * Authorization guard for every money-moving route in this Stripe billing router.
 *
 * WHY `checkRole` AND NOT `isOwner`
 * ---------------------------------
 * `isOwner` (middleware/auth.ts:67) demands the role be EXACTLY `OWNER` and
 * 403s admins. Billing operations legitimately belong to platform admins too, so
 * we authorize the role SET {OWNER, ADMIN} via `checkRole` (middleware/auth.ts:57).
 *
 * WHY THIS GUARD IS MANDATORY
 * ---------------------------
 * The global `app.use('/api', requireAuth)` (app.ts:139) only AUTHENTICATES — it
 * hydrates `req.user` from the JWT and lets any valid user through. It performs
 * NO authorization. Only `/payments/webhooks` is on the PUBLIC allowlist
 * (middleware/requireAuth.ts:121); without a per-route guard every other path
 * here would be callable by ANY logged-in user — including a self-registered
 * TENANT. So each non-webhook route carries `isAuthenticated` (verify the token
 * and populate `req.user`) followed by `checkRole([OWNER, ADMIN])` (authorize).
 */
const requireOwnerOrAdmin: RequestHandler[] = [
  isAuthenticated,
  checkRole([UserRole.OWNER, UserRole.ADMIN]),
];

router.post('/customers', ...requireOwnerOrAdmin, PaymentController.createCustomer);
router.post('/payment-intents', ...requireOwnerOrAdmin, PaymentController.createPaymentIntent);
router.post('/subscriptions', ...requireOwnerOrAdmin, PaymentController.createSubscription);

// NOTE: `/webhooks` is deliberately ANONYMOUS. Stripe cannot present a user JWT;
// it authenticates the request via an HMAC signature over the RAW request bytes
// (`req.rawBody`). It is on the PUBLIC allowlist and the controller fails closed
// with HTTP 400 when the signature is missing or invalid. Adding JWT auth here
// would break Stripe.
router.post('/webhooks', PaymentController.handleWebhook);

router.post('/refunds', ...requireOwnerOrAdmin, PaymentController.createRefund);
router.post('/payment-methods/attach', ...requireOwnerOrAdmin, PaymentController.attachPaymentMethod);
router.get(
  '/customers/:customerId/payment-methods',
  ...requireOwnerOrAdmin,
  PaymentController.getCustomerPaymentMethods
);
router.post('/setup-intents', ...requireOwnerOrAdmin, PaymentController.createSetupIntent);
router.get(
  '/subscriptions/:subscriptionId',
  ...requireOwnerOrAdmin,
  PaymentController.getSubscriptionDetails
);
router.post(
  '/subscriptions/:subscriptionId/cancel',
  ...requireOwnerOrAdmin,
  PaymentController.cancelSubscription
);
router.put('/subscriptions/:subscriptionId', ...requireOwnerOrAdmin, PaymentController.updateSubscription);
router.post('/invoices', ...requireOwnerOrAdmin, PaymentController.createInvoice);
router.post(
  '/customer-portal-session',
  ...requireOwnerOrAdmin,
  PaymentController.getCustomerPortalSession
);
router.post('/calculate-fees', ...requireOwnerOrAdmin, PaymentController.calculateFees);

export default router;
