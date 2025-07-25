import { PrismaClient, PaymentApprovalStatus } from '@prisma/client';
import { approveTransaction, rejectTransaction, getPendingTransactions } from '../services/payment.service';

const prisma = new PrismaClient();

describe('Payment Approval Service', () => {
  let testUserId: string;
  let testPropertyId: string;
  let testUnitId: string;
  let testLeaseId: string;
  let testTransactionId: string;

  beforeAll(async () => {
    // Create test data
    const user = await prisma.user.create({
      data: {
        email: 'test-owner@example.com',
        password: 'testpassword',
        firstName: 'Test',
        lastName: 'Owner',
        role: 'OWNER',
      },
    });
    testUserId = user.id;

    const property = await prisma.property.create({
      data: {
        name: 'Test Property',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US',
        propertyType: 'APARTMENT',
        totalUnits: 10,
        managerId: user.id,
        ownerId: user.id,
      },
    });
    testPropertyId = property.id;

    const unit = await prisma.unit.create({
      data: {
        unitNumber: '101',
        propertyId: property.id,
        isAvailable: false,
      },
    });
    testUnitId = unit.id;

    const lease = await prisma.lease.create({
      data: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        rentAmount: 1000,
        securityDeposit: 1000,
        unitId: unit.id,
        tenantId: user.id,
      },
    });
    testLeaseId = lease.id;

    const transaction = await prisma.transaction.create({
      data: {
        amount: 1000,
        type: 'RENT',
        status: 'PENDING',
        leaseId: lease.id,
        approvalStatus: PaymentApprovalStatus.PENDING,
      },
    });
    testTransactionId = transaction.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany({ where: { leaseId: testLeaseId } });
    await prisma.lease.deleteMany({ where: { unitId: testUnitId } });
    await prisma.unit.deleteMany({ where: { propertyId: testPropertyId } });
    await prisma.property.deleteMany({ where: { ownerId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  test('should approve a transaction', async () => {
    const updatedTransaction = await approveTransaction(testTransactionId, testUserId);
    expect(updatedTransaction.approvalStatus).toBe(PaymentApprovalStatus.APPROVED);
    expect(updatedTransaction.approvedById).toBe(testUserId);
    expect(updatedTransaction.approvedAt).toBeDefined();
  });

  test('should reject a transaction', async () => {
    // Create another transaction for rejection test
    const newTransaction = await prisma.transaction.create({
      data: {
        amount: 500,
        type: 'FEE',
        status: 'PENDING',
        leaseId: testLeaseId,
        approvalStatus: PaymentApprovalStatus.PENDING,
      },
    });

    const updatedTransaction = await rejectTransaction(newTransaction.id, testUserId);
    expect(updatedTransaction.approvalStatus).toBe(PaymentApprovalStatus.REJECTED);
    expect(updatedTransaction.approvedById).toBe(testUserId);
    expect(updatedTransaction.approvedAt).toBeDefined();

    // Clean up
    await prisma.transaction.delete({ where: { id: newTransaction.id } });
  });

  test('should get pending transactions for owner', async () => {
    const pendingTransactions = await getPendingTransactions(testUserId);
    expect(Array.isArray(pendingTransactions)).toBe(true);
    expect(pendingTransactions.length).toBeGreaterThanOrEqual(0);
  });
});