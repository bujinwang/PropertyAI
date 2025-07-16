import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import { config } from '../config/config';

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
    // Notify user and admin
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

  // async createPayPalOrder(amount: number, currency: string) {
  //   const request = new paypal.orders.OrdersCreateRequest();
  //   request.prefer("return=representation");
  //   request.requestBody({
  //     intent: 'CAPTURE',
  //     purchase_units: [
  //       {
  //         amount: {
  //           currency_code: currency,
  //           value: amount.toString(),
  //         },
  //       },
  //     ],
  //   });

  //   return this.payPalClient.execute(request);
  // }
}

export const paymentService = new PaymentService();
