// Existing payment routes from 19.1/19.2

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { processLimiter } = require('../middleware/rateLimit'); // Assume existing
const { body } = require('express-validator');
const paymentService = require('../services/paymentService');
const { verifyStripeWebhook } = require('../middleware/stripeWebhook');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { Payment, Invoice, Tenant } = require('../models'); // Import models

// For webhook: Raw body parsing
router.use('/webhook', express.raw({ type: 'application/json' }));

// Existing /setup and /process routes...
router.post('/setup', authMiddleware, /* validators */, async (req, res) => { /* existing */ });
router.post('/process', authMiddleware, processLimiter, [body('invoiceId').isUUID()], async (req, res) => {
  const { invoiceId, methodId, recurring = false } = req.body;
  const tenantId = req.user.id; // From auth
  const result = await paymentService.processPayment(tenantId, invoiceId, methodId, recurring);
  res.json(result);
});

// New Webhook Route
router.post('/webhook', verifyStripeWebhook, async (req, res) => {
  const event = req.stripeEvent;

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const paymentId = paymentIntent.metadata.paymentId;
        if (paymentId) {
          const payment = await Payment.findByPk(paymentId);
          if (payment && payment.status === 'pending') {
            payment.status = 'paid';
            payment.stripeChargeId = paymentIntent.id;
            await payment.save();
            const invoice = await Invoice.findByPk(payment.invoiceId);
            invoice.status = 'paid';
            await invoice.save();
            await NotificationService.notifyPaymentSuccess(payment);
            logger.info(`Payment succeeded: ${paymentId}`);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        const failedPaymentId = failedIntent.metadata.paymentId;
        if (failedPaymentId) {
          const payment = await Payment.findByPk(failedPaymentId);
          if (payment) {
            payment.status = 'failed';
            await payment.save();
            await NotificationService.notifyPaymentFailed(payment);
            logger.warn(`Payment failed: ${failedPaymentId}`);
          }
        }
        break;

      case 'invoice.payment_succeeded':
        // Handle invoice updates if needed
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        const invoiceId = failedInvoice.metadata.invoiceId; // Assume set during creation
        if (invoiceId) {
          const invoice = await Invoice.findByPk(invoiceId);
          if (invoice && invoice.status === 'pending') {
            invoice.status = 'overdue'; // Or failed
            await invoice.save();
            await NotificationService.notifyPaymentFailed({ invoiceId, tenantId: invoice.tenantId });
            logger.warn(`Invoice payment failed: ${invoiceId}`);
          }
        }
        break;

      case 'subscription.schedule.updated':
        // Check for overdue invoices
        const schedule = event.data.object;
        // Logic to query and notify overdue if applicable
        logger.info(`Subscription schedule updated: ${schedule.id}`);
        break;

      default:
        logger.info(`Unhandled Stripe event: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);
    res.status(400).json({ error: 'Webhook handler failed' });
  }
});

// New History Endpoint for Frontend
router.get('/history', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role; // Assume 'tenant' or 'owner' in JWT

  try {
    let payments;
    if (role === 'tenant') {
      // For tenant: Their payments
      payments = await Payment.findAll({
        where: { tenantId: userId },
        include: [
          {
            model: Invoice,
            as: 'invoice',
            attributes: ['id', 'dueDate', 'amount', 'status']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else if (role === 'owner') {
      // For owner: Payments for their units/tenants
      payments = await Payment.findAll({
        include: [
          {
            model: Invoice,
            as: 'invoice',
            include: [
              {
                model: Tenant,
                as: 'tenant',
                where: { ownerId: userId } // Assume Tenant has ownerId
              }
            ],
            attributes: ['id', 'dueDate', 'amount', 'status']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      return res.status(403).json({ error: 'Invalid role' });
    }

    const history = payments.map(p => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      date: p.createdAt,
      invoiceNumber: p.invoice ? `#${p.invoice.id}` : 'N/A',
      invoiceDueDate: p.invoice ? p.invoice.dueDate : null,
      invoiceAmount: p.invoice ? p.invoice.amount : null
    }));

    res.json({ payments: history });
  } catch (error) {
    logger.error(`History fetch error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;