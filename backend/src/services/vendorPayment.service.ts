import { PrismaClient, VendorPayment, Prisma } from '@prisma/client';
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
        WorkOrderAssignment: { // Changed from 'assignments' to 'WorkOrderAssignment'
          include: {
            Vendor: true, // Changed from 'vendor' to 'Vendor'
          },
        },
        CostEstimation: true, // Changed from 'costEstimation' to 'CostEstimation'
      },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const assignment = workOrder.WorkOrderAssignment[0]; // Updated property name
    if (!assignment) {
      throw new Error('Work order is not assigned to a vendor');
    }

    const vendor = assignment.Vendor; // Updated property name
    if (!vendor.stripeAccountId) {
      throw new Error('Vendor does not have a Stripe account connected');
    }

    const amount = workOrder.CostEstimation?.estimatedCost || 0; // Updated property name
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

  /**
   * Verify a Stripe webhook signature against the RAW request bytes.
   *
   * Stripe signs the exact bytes it sent, so verification is only possible with
   * the untouched request buffer (`req.rawBody`), never the parsed `req.body`.
   *
   * This method is intentionally pure verification: it does NOT fall back to a
   * "no secret configured" passthrough and does NOT swallow Stripe's error.
   * `constructEvent` throws when the signature, secret or timestamp is missing /
   * invalid; callers MUST translate that throw into a fail-closed HTTP 400 and
   * MUST NOT proceed to {@link handleStripeWebhook}.
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string): Stripe.Event {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
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

  /**
   * Payment history for a vendor.
   *
   * @param vendorId         The vendor whose payments to return.
   * @param managerUserId    Optional PROPERTY_MANAGER / OWNER scope. When set,
   *                         the result is restricted to payments whose work
   *                         order belongs to a rental this user manages or owns,
   *                         so a manager can never read another manager's
   *                         payouts. Omit for ADMIN (full history).
   */
  async getPaymentHistory(vendorId: string, managerUserId?: string): Promise<VendorPayment[]> {
    const where: Prisma.VendorPaymentWhereInput = { vendorId };

    if (managerUserId) {
      // WorkOrder -> MaintenanceRequest -> Rental -> (managerId | ownerId)
      where.WorkOrder = {
        MaintenanceRequest: {
          Rental: {
            OR: [{ managerId: managerUserId }, { ownerId: managerUserId }],
          },
        },
      };
    }

    return prisma.vendorPayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const vendorPaymentService = new VendorPaymentService();