import { PrismaClient, Transaction, VendorPayment, TransactionStatus, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any
});

/**
 * Tenant-paid ACH convenience fee — the PropertyAI Free revenue line.
 *
 * Spec: `deliverables/software-company/propertyai-gtm-free-tier-spec-2026-09-17.md:57`
 * — "Tenant-paid ACH convenience fee: **1.25%, min $2.50, max $12.00**".
 *
 * UNITS: all amounts here are in CENTS, matching Stripe's own unit. The previous
 * implementation (`amount * 0.029 + 30`) returned Stripe's *processing* cost —
 * 2.9% + 30¢ — which is what it costs to take the money, not what we charge for
 * taking it. It is a different quantity at a different rate.
 */
const TENANT_FEE_RATE = 0.0125;
const TENANT_FEE_MIN_CENTS = 250; // $2.50
const TENANT_FEE_MAX_CENTS = 1200; // $12.00

export const paymentService = {
  approveTransaction: async (transactionId: string, userId: string): Promise<Transaction> => {
    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new Error('Transaction is not pending approval');
    }

    return prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.COMPLETED,
        approvedById: userId,
      },
    });
  },

  rejectTransaction: async (transactionId: string, userId: string): Promise<Transaction> => {
    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new Error('Transaction is not pending approval');
    }

    return prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.FAILED,
        approvedById: userId,
      },
    });
  },

  approveVendorPayment: async (vendorPaymentId: string, userId: string): Promise<VendorPayment> => {
    const vendorPayment = await prisma.vendorPayment.findUnique({ where: { id: vendorPaymentId } });

    if (!vendorPayment) {
      throw new Error('Vendor payment not found');
    }

    if (vendorPayment.status !== PaymentStatus.PENDING) {
      throw new Error('Vendor payment is not pending approval');
    }

    return prisma.vendorPayment.update({
      where: { id: vendorPaymentId },
      data: {
        status: PaymentStatus.PAID,
        approvedById: userId,
      },
    });
  },

  rejectVendorPayment: async (vendorPaymentId: string, userId: string): Promise<VendorPayment> => {
    const vendorPayment = await prisma.vendorPayment.findUnique({ where: { id: vendorPaymentId } });

    if (!vendorPayment) {
      throw new Error('Vendor payment not found');
    }

    if (vendorPayment.status !== PaymentStatus.PENDING) {
      throw new Error('Vendor payment is not pending approval');
    }

    return prisma.vendorPayment.update({
      where: { id: vendorPaymentId },
      data: {
        status: PaymentStatus.FAILED,
        approvedById: userId,
      },
    });
  },

  getPendingTransactions: async (userId: string): Promise<Transaction[]> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { rentalsOwned: true } // Changed from 'RentalOwner' to 'rentalsOwned'
    });

    if (!user) {
      throw new Error('User not found');
    }

    const rentalIds = user.rentalsOwned.map((rental: any) => rental.id); // Changed from 'RentalOwner' to 'rentalsOwned' and added type annotation

    return prisma.transaction.findMany({
      where: {
        status: TransactionStatus.PENDING,
        Lease: {
          Rental: {
            id: {
              in: rentalIds
            }
          }
        }
      },
      include: {
        Lease: {
          include: {
            Rental: true,
            User: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },

  getPendingVendorPayments: async (userId: string): Promise<VendorPayment[]> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { rentalsOwned: true } // Changed from 'RentalOwner' to 'rentalsOwned'
    });

    if (!user) {
      throw new Error('User not found');
    }

    const rentalIds = user.rentalsOwned.map((rental: any) => rental.id); // Changed from 'RentalOwner' to 'rentalsOwned' and added type annotation

    return prisma.vendorPayment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        WorkOrder: { // Changed from 'workOrder' to 'WorkOrder'
          MaintenanceRequest: { // Changed from 'maintenanceRequest' to 'MaintenanceRequest'
            rentalId: {
              in: rentalIds
            }
          }
        }
      },
      include: {
        WorkOrder: { // Changed from 'workOrder' to 'WorkOrder'
          include: {
            MaintenanceRequest: { // Changed from 'maintenanceRequest' to 'MaintenanceRequest'
              include: {
                Rental: true
              }
            }
          }
        },
        Vendor: true // Changed from 'vendor' to 'Vendor'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },

  async createCustomer(customerData: Stripe.CustomerCreateParams) {
    return stripe.customers.create(customerData);
  },

  async createPaymentIntent(amount: number, currency: string, customerId: string) {
    return stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId
    });
  },

  async createSubscription(customerId: string, items: Stripe.SubscriptionCreateParams.Item[]) {
    return stripe.subscriptions.create({
      customer: customerId,
      items
    });
  },

  async processPaymentWebhook(requestBody: Buffer, sigHeader: string) {
    const event = stripe.webhooks.constructEvent(
      requestBody,
      sigHeader,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    // Handle the event according to your business logic
    return event;
  },

  async collectDeposit(leaseId: string, amount: number, currency: string) {
    // Implement deposit collection logic here
    return {};
  },

  async createRefund(paymentIntentId: string) {
    return stripe.refunds.create({
      payment_intent: paymentIntentId
    });
  },

  async attachPaymentMethod(customerId: string, paymentMethodId: string) {
    return stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });
  },

  async getCustomerPaymentMethods(customerId: string) {
    return stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });
  },

  async createSetupIntent(customerId: string) {
    return stripe.setupIntents.create({
      customer: customerId
    });
  },

  async getSubscriptionDetails(subscriptionId: string) {
    return stripe.subscriptions.retrieve(subscriptionId);
  },

  async cancelSubscription(subscriptionId: string, prorate: boolean = true) {
    return stripe.subscriptions.cancel(subscriptionId, {
      prorate
    });
  },

  async updateSubscription(subscriptionId: string, items: Stripe.SubscriptionUpdateParams.Item[]) {
    return stripe.subscriptions.update(subscriptionId, {
      items
    });
  },

  async createInvoice(customerId: string, items: Stripe.InvoiceItemCreateParams[]) {
    // First, create invoice items
    for (const item of items) {
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: item.amount,
        quantity: item.quantity,
        currency: item.currency || 'usd',
        description: item.description || 'Invoice item',
      });
    }
    // Then create the invoice
    return stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 7,
      auto_advance: true,
    });
  },

  async getCustomerPortalSession(customerId: string, returnUrl: string) {
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
  },

  /**
   * The tenant-paid ACH convenience fee for a rent payment.
   *
   * @param amount Rent amount in CENTS (Stripe's unit).
   * @returns The fee in CENTS: 1.25% of `amount`, floored at $2.50, capped at
   *          $12.00. The floor binds below a $200 payment and the cap above $960,
   *          so most payments attract the floor or the cap rather than the rate.
   *
   * The cap matters: at a $2,000 rent the rate alone would be $25.00, and a fee
   * that size on a free tier is a churn event, not revenue.
   */
  async calculateFees(amount: number) {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('amount must be a non-negative number of cents');
    }

    const raw = Math.round(amount * TENANT_FEE_RATE);
    return Math.min(Math.max(raw, TENANT_FEE_MIN_CENTS), TENANT_FEE_MAX_CENTS);
  }
};
