import Stripe from 'stripe';

class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createCustomer(email: string, name: string) {
    return this.stripe.customers.create({ email, name });
  }

  async createPaymentIntent(amount: number, currency: string) {
    return this.stripe.paymentIntents.create({
      amount,
      currency,
    });
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
}

export default new PaymentService();
