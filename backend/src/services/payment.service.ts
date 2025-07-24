import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import { config } from '../config/config';
import { pushNotificationService } from './pushNotification.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class PaymentService {
  private stripe: Stripe;
  private payPalClient: any;

  constructor() {
    if (!config.stripe.secretKey) {
      throw new Error('Stripe secret key is not defined');
    }
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2025-04-10',
    } as any);

    // if (!config.paypal.clientId || !config.paypal.clientSecret) {
    //   throw new Error('PayPal client ID or secret is not defined');
    // }
    // const environment = new paypal.core.SandboxEnvironment(
    //   config.paypal.clientId,
    //   config.paypal.clientSecret
    // );
    // this.payPalClient = new paypal.core.PayPalHttpClient(environment);
  }

  async createStripePaymentIntent(amount: number, currency: string) {
    return this.stripe.paymentIntents.create({
      amount,
      currency,
    });
  }

  async createCustomer(email: string, name: string) {
    return this.stripe.customers.create({ email, name });
  }

  async createSubscription(customerId: string, priceId: string) {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });
  }

  async handleFailedPayment(paymentIntentId: string) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      paymentIntentId
    );
    const customerId = paymentIntent.customer as string;

    if (customerId) {
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
        include: { devices: true },
      });

      if (user && user.devices.length > 0) {
        const { devices } = user;
        const title = 'Payment Failed';
        const body =
          'Your recent payment failed. Please update your payment information.';

        for (const device of devices) {
          if (device.platform === 'android') {
            await pushNotificationService.sendAndroidNotification(
              device.token,
              title,
              body
            );
          } else if (device.platform === 'ios') {
            await pushNotificationService.sendIOSNotification(
              device.token,
              title,
              body
            );
          }
        }
      }
    }

    console.log('Payment failed:', paymentIntent.last_payment_error?.message);
  }

  async createPaymentIntent(amount: number, currency: string, customerId: string) {
    return this.stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
    });
  }

  async processPayment(paymentMethodId: string, amount: number, currency: string) {
    return this.stripe.paymentIntents.create({
      amount,
      currency,
      payment_method: paymentMethodId,
      confirm: true,
    });
  }

  async collectDeposit(leaseId: string, amount: number, currency: string) {
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: { tenant: true },
    });

    if (!lease) {
      throw new Error('Lease not found');
    }

    const { tenant } = lease;
    if (!tenant.stripeCustomerId) {
      throw new Error('Tenant does not have a Stripe customer ID');
    }

    return this.createPaymentIntent(amount, currency, tenant.stripeCustomerId);
  }

  async processPaymentWebhook(body: any, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      await this.handleWebhookEvent(event);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
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
        console.log(`Unhandled event type: ${event.type}`);
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

    console.log(`Payment succeeded: ${paymentIntent.id}`);
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

    console.warn(`Payment failed: ${paymentIntent.id}`);
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
      const refund = await this.stripe.refunds.create({
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
      console.error('Failed to create refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error) {
      console.error('Failed to attach payment method:', error);
      throw new Error('Failed to attach payment method');
    }
  }

  async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Failed to get customer payment methods:', error);
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
      console.error('Failed to get payment history:', error);
      throw new Error('Failed to get payment history');
    }
  }

  async createSetupIntent(customerId: string): Promise<string> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        usage: 'off_session',
      });

      return setupIntent.client_secret!;
    } catch (error) {
      console.error('Failed to create setup intent:', error);
      throw new Error('Failed to create setup intent');
    }
  }

  async getSubscriptionDetails(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Failed to get subscription details:', error);
      throw new Error('Failed to get subscription details');
    }
  }

  async cancelSubscription(subscriptionId: string, prorate: boolean = true): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId, {
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
      console.error('Failed to cancel subscription:', error);
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
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: items.map(item => ({
          id: item.id,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      return subscription;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  async createInvoice(customerId: string, items: Array<{
    price: string;
    quantity: number;
  }>): Promise<Stripe.Invoice> {
    try {
      const invoice = await this.stripe.invoices.create({
        customer: customerId,
        collection_method: 'charge_automatically',
        auto_advance: true,
        expand: ['payment_intent'],
      });

      for (const item of items) {
        await this.stripe.invoiceItems.create({
          customer: customerId,
          price: item.price,
          quantity: item.quantity,
          invoice: invoice.id,
        });
      }

      return await this.stripe.invoices.finalizeInvoice(invoice.id);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  async getCustomerPortalSession(customerId: string, returnUrl: string): Promise<string> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      console.error('Failed to create customer portal session:', error);
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
