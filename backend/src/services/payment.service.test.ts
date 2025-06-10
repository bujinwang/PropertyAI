import { PrismaClient } from '@prisma/client';
import { paymentService } from './payment.service';
import Stripe from 'stripe';

jest.mock('stripe');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

describe('Payment Service', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should process a payment', async () => {
    const manager = await prisma.user.create({
      data: {
        email: 'manager-payment-test@test.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'Manager',
        role: 'PROPERTY_MANAGER',
      },
    });

    const owner = await prisma.user.create({
      data: {
        email: 'owner-payment-test@test.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'Owner',
        role: 'PROPERTY_MANAGER',
      },
    });

    const property = await prisma.property.create({
      data: {
        name: 'Test Property',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'TC',
        propertyType: 'APARTMENT',
        totalUnits: 1,
        managerId: manager.id,
        ownerId: owner.id,
      },
    });

    const unit = await prisma.unit.create({
      data: {
        unitNumber: '101',
        propertyId: property.id,
      },
    });

    const tenant = await prisma.user.create({
      data: {
        email: 'tenant-payment-test@test.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'Tenant',
      },
    });

    const lease = await prisma.lease.create({
      data: {
        startDate: new Date(),
        endDate: new Date(),
        rentAmount: 1000,
        securityDeposit: 500,
        unitId: unit.id,
        tenantId: tenant.id,
      },
    });

    await paymentService.processPayment(lease.id);

    const transaction = await prisma.transaction.findFirst({
      where: {
        leaseId: lease.id,
      },
    });

    expect(transaction).not.toBeNull();
    expect(transaction?.status).toBe('COMPLETED');
  });
});
