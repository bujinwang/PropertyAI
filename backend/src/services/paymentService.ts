import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

interface PaymentIntentData {
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
  description?: string;
  receiptEmail?: string;
  setupFutureUsage?: 'off_session' | 'on_session';
}

interface SubscriptionData {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
}

interface RefundData {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}

interface PaymentMethodData {
  type: 'card' | 'bank_account' | 'us_bank_account';
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}

class PaymentService {
  async createCustomer(userData: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        metadata: userData.metadata,
      });

      await prisma.user.update({
        where: { email: userData.email },
        data: { stripeCustomerId: customer.id },
      });

      return customer.id;
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  async createPaymentIntent(data: PaymentIntentData): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        customer: data.customerId,
        metadata: data.metadata,
        description: data.description,
        receipt_email: data.receiptEmail,
        setup_future_usage: data.setupFutureUsage,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      logger.error('Failed to create payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async createSubscription(data: SubscriptionData): Promise<{
    subscriptionId: string;
    clientSecret: string;
  }> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: data.customerId,
        items: [{ price: data.priceId }],
        metadata: data.metadata,
        trial_period_days: data.trialPeriodDays,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  async processPaymentWebhook(body: any, signature: string): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      await this.handleWebhookEvent(event);
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  private async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'invoice.payment_succeeded':
        await this.handleSubscriptionPayment(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await prisma.payment.create({
      data: {
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
        metadata: paymentIntent.metadata as any,
        customerId: paymentIntent.customer as string,
      },
    });

    logger.info(`Payment succeeded: ${paymentIntent.id}`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await prisma.payment.create({
      data: {
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'failed',
        metadata: paymentIntent.metadata as any,
        customerId: paymentIntent.customer as string,
        failureReason: paymentIntent.last_payment_error?.message,
      },
    });

    logger.warn(`Payment failed: ${paymentIntent.id}`);
  }

  private async handleSubscriptionPayment(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: {
          lastPaymentAt: new Date(),
          status: 'active',
        },
      });
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  private async handleSubscriptionCancellation(subscription: Stripe.Subscription): Promise<void> {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });
  }

  async createRefund(data: RefundData): Promise<Stripe.Refund> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: data.paymentIntentId,
        amount: data.amount,
        reason: data.reason as Stripe.RefundCreateParams.Reason,
      });

      await prisma.refund.create({
        data: {
          stripeRefundId: refund.id,
          stripePaymentIntentId: data.paymentIntentId,
          amount: refund.amount,
          status: refund.status,
          reason: data.reason,
        },
      });

      return refund;
    } catch (error) {
      logger.error('Failed to create refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error) {
      logger.error('Failed to attach payment method:', error);
      throw new Error('Failed to attach payment method');
    }
  }

  async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Failed to get customer payment methods:', error);
      throw new Error('Failed to get payment methods');
    }
  }

  async getPaymentHistory(customerId: string): Promise<any[]> {
    try {
      const payments = await prisma.payment.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });

      return payments;
    } catch (error) {
      logger.error('Failed to get payment history:', error);
      throw new Error('Failed to get payment history');
    }
  }

  async createSetupIntent(customerId: string): Promise<string> {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: 'off_session',
      });

      return setupIntent.client_secret!;
    } catch (error) {
      logger.error('Failed to create setup intent:', error);
      throw new Error('Failed to create setup intent');
    }
  }

  async getSubscriptionDetails(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Failed to get subscription details:', error);
      throw new Error('Failed to get subscription details');
    }
  }

  async cancelSubscription(subscriptionId: string, prorate: boolean = true): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId, {
        prorate,
      });

      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  async updateSubscription(
    subscriptionId: string,
    items: Array<{
      id?: string;
      price: string;
      quantity?: number;
    }>
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        items: items.map(item => ({
          id: item.id,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to update subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  async createInvoice(customerId: string, items: Array<{
    price: string;
    quantity: number;
  }>): Promise<Stripe.Invoice> {
    try {
      const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: 'charge_automatically',
        auto_advance: true,
        expand: ['payment_intent'],
      });

      for (const item of items) {
        await stripe.invoiceItems.create({
          customer: customerId,
          price: item.price,
          quantity: item.quantity,
          invoice: invoice.id,
        });
      }

      return await stripe.invoices.finalizeInvoice(invoice.id);
    } catch (error) {
      logger.error('Failed to create invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  async getCustomerPortalSession(customerId: string, returnUrl: string): Promise<string> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      logger.error('Failed to create customer portal session:', error);
      throw new Error('Failed to create customer portal session');
    }
  }

  async calculateFees(amount: number): Promise<{
    stripeFee: number;
    netAmount: number;
  }> {
    const stripeFee = Math.round((amount * 0.029 + 30) * 100) / 100;
    const netAmount = amount - stripeFee;

    return { stripeFee, netAmount };
  }
}

export const paymentService = new PaymentService();