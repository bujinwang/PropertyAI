import { PrismaClient } from '@prisma/client';

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