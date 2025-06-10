import Stripe from 'stripe';
import { prisma } from '../config/database';
import logger from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

class PaymentService {
  async createCustomer(email: string, name: string) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
      });
      return customer;
    } catch (error) {
      logger.error(`Error creating Stripe customer: ${error}`);
      throw new Error('Failed to create customer.');
    }
  }

  async createPaymentIntent(amount: number, currency: string, customerId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        payment_method_types: ['card'],
      });
      return paymentIntent;
    } catch (error) {
      logger.error(`Error creating PaymentIntent: ${error}`);
      throw new Error('Failed to create PaymentIntent.');
    }
  }

  async processPayment(leaseId: string) {
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: { tenant: true },
    });

    if (!lease || !lease.tenant) {
      throw new Error('Lease or tenant not found.');
    }

    // This is a placeholder. In a real application, you would retrieve the Stripe customer ID
    // associated with the tenant.
    const stripeCustomerId = 'cus_...'; // Placeholder

    try {
      const paymentIntent = await this.createPaymentIntent(
        lease.rentAmount * 100, // Stripe expects amount in cents
        'usd',
        stripeCustomerId
      );

      // In a real application, you would confirm the payment on the client-side
      // using the client_secret from the PaymentIntent.
      // For this service, we'll simulate a successful payment.

      await prisma.transaction.create({
        data: {
          amount: lease.rentAmount,
          type: 'RENT',
          status: 'COMPLETED',
          leaseId: lease.id,
          paymentMethod: 'stripe',
          reference: paymentIntent.id,
        },
      });

      logger.info(`Successfully processed rent payment for lease ${leaseId}`);
    } catch (error) {
      logger.error(`Failed to process rent payment for lease ${leaseId}: ${error}`);
      await prisma.transaction.create({
        data: {
          amount: lease.rentAmount,
          type: 'RENT',
          status: 'FAILED',
          leaseId: lease.id,
          paymentMethod: 'stripe',
        },
      });
    }
  }
}

export const paymentService = new PaymentService();
