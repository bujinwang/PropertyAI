import { PrismaClient, Transaction, VendorPayment, PaymentApprovalStatus } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any
});

export const paymentService = {
  approveTransaction: async (transactionId: string, userId: string): Promise<Transaction> => {
    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.approvalStatus !== PaymentApprovalStatus.PENDING) {
      throw new Error('Transaction is not pending approval');
    }

    return prisma.transaction.update({
      where: { id: transactionId },
      data: {
        approvalStatus: PaymentApprovalStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: userId,
      },
    });
  },

  rejectTransaction: async (transactionId: string, userId: string): Promise<Transaction> => {
    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.approvalStatus !== PaymentApprovalStatus.PENDING) {
      throw new Error('Transaction is not pending approval');
    }

    return prisma.transaction.update({
      where: { id: transactionId },
      data: {
        approvalStatus: PaymentApprovalStatus.REJECTED,
        approvedAt: new Date(),
        approvedById: userId,
      },
    });
  },

  approveVendorPayment: async (vendorPaymentId: string, userId: string): Promise<VendorPayment> => {
    const vendorPayment = await prisma.vendorPayment.findUnique({ where: { id: vendorPaymentId } });

    if (!vendorPayment) {
      throw new Error('Vendor payment not found');
    }

    if (vendorPayment.approvalStatus !== PaymentApprovalStatus.PENDING) {
      throw new Error('Vendor payment is not pending approval');
    }

    return prisma.vendorPayment.update({
      where: { id: vendorPaymentId },
      data: {
        approvalStatus: PaymentApprovalStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: userId,
      },
    });
  },

  rejectVendorPayment: async (vendorPaymentId: string, userId: string): Promise<VendorPayment> => {
    const vendorPayment = await prisma.vendorPayment.findUnique({ where: { id: vendorPaymentId } });

    if (!vendorPayment) {
      throw new Error('Vendor payment not found');
    }

    if (vendorPayment.approvalStatus !== PaymentApprovalStatus.PENDING) {
      throw new Error('Vendor payment is not pending approval');
    }

    return prisma.vendorPayment.update({
      where: { id: vendorPaymentId },
      data: {
        approvalStatus: PaymentApprovalStatus.REJECTED,
        approvedAt: new Date(),
        approvedById: userId,
      },
    });
  },

  getPendingTransactions: async (userId: string): Promise<Transaction[]> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { propertiesOwned: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const propertyIds = user.propertiesOwned.map(property => property.id);

    return prisma.transaction.findMany({
      where: {
        approvalStatus: PaymentApprovalStatus.PENDING,
        lease: {
          unit: {
            propertyId: {
              in: propertyIds
            }
          }
        }
      },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: true
              }
            },
            tenant: true
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
      include: { propertiesOwned: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const propertyIds = user.propertiesOwned.map(property => property.id);

    return prisma.vendorPayment.findMany({
      where: {
        approvalStatus: PaymentApprovalStatus.PENDING,
        workOrder: {
          maintenanceRequest: {
            propertyId: {
              in: propertyIds
            }
          }
        }
      },
      include: {
        workOrder: {
          include: {
            maintenanceRequest: {
              include: {
                property: true
              }
            }
          }
        },
        vendor: true
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
        price: item.price,
        quantity: item.quantity,
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

  async calculateFees(amount: number) {
    // Simplified fee calculation example, replace with actual calculation
    return amount * 0.029 + 30;
  }
};
