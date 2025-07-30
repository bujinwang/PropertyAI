import { PrismaClient, VendorPayment } from '@prisma/client';
import Stripe from 'stripe';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15' as any, // Updated API version
});

class VendorPaymentService {
  async initiatePayment(workOrderId: string): Promise<VendorPayment> {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        assignments: {
          include: {
            vendor: true,
          },
        },
        costEstimation: true, // Include costEstimation
      },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const assignment = workOrder.assignments[0];
    if (!assignment) {
      throw new Error('Work order is not assigned to a vendor');
    }

    const vendor = assignment.vendor;
    if (!vendor.stripeAccountId) {
      throw new Error('Vendor does not have a Stripe account connected');
    }

    const amount = (workOrder.costEstimation?.estimation as any)?.estimatedCost; // Access nested property and cast
    if (!amount) {
      throw new Error('Work order does not have an estimated cost');
    }

    const vendorPayment = await prisma.vendorPayment.create({
      data: {
        workOrderId,
        vendorId: vendor.id,
        amount,
        status: 'PENDING',
      },
    });

    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Amount in cents
        currency: 'usd',
        destination: vendor.stripeAccountId,
        transfer_group: workOrderId,
        metadata: {
          vendorPaymentId: vendorPayment.id,
        },
      });

      return await prisma.vendorPayment.update({
        where: { id: vendorPayment.id },
        data: {
          status: 'PROCESSING',
          transactionId: transfer.id,
        } as any, // Cast to any to bypass type checking
      });
    } catch (error) {
      logger.error(`Stripe transfer failed: ${error}`); // Concatenate error message
      await prisma.vendorPayment.update({
        where: { id: vendorPayment.id },
        data: { status: 'FAILED' },
      });
      throw new Error('Failed to initiate payment');
    }
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    if (event.type === 'payout.paid') {
      const payout = event.data.object as Stripe.Payout;
      const vendorPaymentId = payout.metadata?.vendorPaymentId;

      if (vendorPaymentId) {
        await prisma.vendorPayment.update({
          where: { id: vendorPaymentId },
          data: {
            status: 'PAID',
            processedAt: new Date(payout.arrival_date * 1000),
          } as any, // Cast to any to bypass type checking
        });
      }
    } else if (event.type === 'payout.failed') {
      const payout = event.data.object as Stripe.Payout;
      const vendorPaymentId = payout.metadata?.vendorPaymentId;

      if (vendorPaymentId) {
        await prisma.vendorPayment.update({
          where: { id: vendorPaymentId },
          data: { status: 'FAILED' },
        });
      }
    }
  }

  async getPaymentHistory(vendorId: string): Promise<VendorPayment[]> {
    return prisma.vendorPayment.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const vendorPaymentService = new VendorPaymentService();