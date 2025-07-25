import { PrismaClient, Transaction, VendorPayment, PaymentApprovalStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Approves a transaction.
 *
 * @param transactionId - The ID of the transaction to approve.
 * @param userId - The ID of the user approving the transaction.
 * @returns The updated transaction.
 */
export const approveTransaction = async (transactionId: string, userId: string): Promise<Transaction> => {
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
};

/**
 * Rejects a transaction.
 *
 * @param transactionId - The ID of the transaction to reject.
 * @param userId - The ID of the user rejecting the transaction.
 * @returns The updated transaction.
 */
export const rejectTransaction = async (transactionId: string, userId: string): Promise<Transaction> => {
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
};

/**
 * Approves a vendor payment.
 *
 * @param vendorPaymentId - The ID of the vendor payment to approve.
 * @param userId - The ID of the user approving the payment.
 * @returns The updated vendor payment.
 */
export const approveVendorPayment = async (vendorPaymentId: string, userId: string): Promise<VendorPayment> => {
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
};

/**
 * Rejects a vendor payment.
 *
 * @param vendorPaymentId - The ID of the vendor payment to reject.
 * @param userId - The ID of the user rejecting the payment.
 * @returns The updated vendor payment.
 */
export const rejectVendorPayment = async (vendorPaymentId: string, userId: string): Promise<VendorPayment> => {
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
};

/**
 * Gets pending transactions for a user.
 *
 * @param userId - The ID of the user to get pending transactions for.
 * @returns Array of pending transactions.
 */
export const getPendingTransactions = async (userId: string): Promise<Transaction[]> => {
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
};

/**
 * Gets pending vendor payments for a user.
 *
 * @param userId - The ID of the user to get pending vendor payments for.
 * @returns Array of pending vendor payments.
 */
export const getPendingVendorPayments = async (userId: string): Promise<VendorPayment[]> => {
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
};
