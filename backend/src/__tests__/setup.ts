import { PrismaClient } from '@prisma/client';

jest.mock('ioredis', () => {
  const IORedis = jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
  }));
  return IORedis;
});

jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('../utils/cache.ts', () => ({
    getCache: jest.fn().mockResolvedValue(null),
    setCache: jest.fn(),
}));


const mockPrismaClient = {
  user: {
    create: jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', password: 'hashed_password' }),
    findUnique: jest.fn().mockImplementation((query) => {
      if (query.where.email === 'nonexistent@example.com') {
        return Promise.resolve(null);
      }
      return Promise.resolve({ id: 'test-user-id', email: query.where.email, password: 'hashed_password' });
    }),
    findFirst: jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', password: 'hashed_password' }),
    update: jest.fn().mockResolvedValue({ id: 'test-user-id' }),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  property: {
    create: jest.fn().mockResolvedValue({ id: 'test-property-id', name: 'Test Property' }),
    findMany: jest.fn().mockResolvedValue([{ id: 'test-property-id', name: 'Test Property' }]),
    findUnique: jest.fn().mockImplementation((query) => {
        if (query.where.id === 'non-existent-id') {
            return Promise.resolve(null);
        }
        return Promise.resolve({ id: query.where.id, name: 'Test Property' })
    }),
    update: jest.fn().mockResolvedValue({ id: 'test-property-id', name: 'Updated Property' }),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn(),
  },
  unit: {
    create: jest.fn().mockResolvedValue({ id: 'test-unit-id', unitNumber: 'A101' }),
    findMany: jest.fn().mockResolvedValue([{ id: 'test-unit-id', unitNumber: 'A101' }]),
    findUnique: jest.fn().mockImplementation((query) => {
        if (query.where.id === 'non-existent-id') {
            return Promise.resolve(null);
        }
        return Promise.resolve({ id: query.where.id, unitNumber: 'A101' })
    }),
    update: jest.fn().mockResolvedValue({ id: 'test-unit-id', monthlyRent: 1300, isOccupied: true }),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn(),
    count: jest.fn().mockResolvedValue(1),
  },
  lease: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  maintenanceRequest: {
    create: jest.fn().mockResolvedValue({ id: 'test-maintenance-id', title: 'Leaky faucet' }),
    findMany: jest.fn().mockResolvedValue([{ id: 'test-maintenance-id', title: 'Leaky faucet' }]),
    findUnique: jest.fn().mockImplementation((query) => {
        if (query.where.id === 'non-existent-id') {
            return Promise.resolve(null);
        }
        return Promise.resolve({ id: query.where.id, title: 'Leaky faucet' })
    }),
    update: jest.fn().mockResolvedValue({ id: 'test-maintenance-id', status: 'COMPLETED' }),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  auditEntry: {
      create: jest.fn(),
      deleteMany: jest.fn(),
  },
  photoAnalysis: {
      deleteMany: jest.fn(),
  },
  costEstimation: {
      deleteMany: jest.fn(),
  },
  scheduledEvent: {
      deleteMany: jest.fn(),
  },
  workOrderAssignment: {
      deleteMany: jest.fn(),
  },
  workOrderQuote: {
      deleteMany: jest.fn(),
  },
  workOrder: {
      deleteMany: jest.fn(),
  },
  listingImage: {
      deleteMany: jest.fn(),
  },
  aIListingSuggestion: {
      deleteMany: jest.fn(),
  },
  aIPricingSuggestion: {
      deleteMany: jest.fn(),
  },
  listing: {
      deleteMany: jest.fn(),
  },
  unitImage: {
      deleteMany: jest.fn(),
  },
  propertyImage: {
      deleteMany: jest.fn(),
  },
  document: {
      deleteMany: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn().mockResolvedValue([]),
  $queryRawUnsafe: jest.fn().mockResolvedValue([]),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

export default mockPrismaClient;

const prisma = new PrismaClient();

beforeAll(async () => {
  // Ensure test database is clean - delete in reverse order of dependencies
  // Handle AuditEntry dependencies first
  await prisma.auditEntry.deleteMany({});
  
  // Then continue with the rest
  await prisma.photoAnalysis.deleteMany({});
  await prisma.costEstimation.deleteMany({});
  await prisma.scheduledEvent.deleteMany({});
  await prisma.workOrderAssignment.deleteMany({});
  await prisma.workOrderQuote.deleteMany({});
  await prisma.workOrder.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.listingImage.deleteMany({});
  await prisma.aIListingSuggestion.deleteMany({});
  await prisma.aIPricingSuggestion.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.unitImage.deleteMany({});
  await prisma.propertyImage.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.lease.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Mock Redis connections for testing
jest.mock('../utils/cache', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    connect: jest.fn(),
  }
}));

// Mock PubSub service
jest.mock('../services/pubSub.service', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  }))
}));

// Mock email service
jest.mock('../services/emailService', () => ({
  __esModule: true,
  sendRecoveryEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendEmail: jest.fn().mockResolvedValue(undefined)
}));

