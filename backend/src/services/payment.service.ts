import Stripe from 'stripe';
import { prisma } from '../config/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

class PaymentService {
  public async createPaymentIntent(amount: number, currency: string, customerId: string) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
    });
    return paymentIntent;
  }

  public async handleSuccessfulPayment(paymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const transaction = await prisma.transaction.updateMany({
      where: {
        reference: paymentIntent.id,
      },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });
    return transaction;
  }
}

export const paymentService = new PaymentService();
