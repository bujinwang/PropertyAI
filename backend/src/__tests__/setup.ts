/// <reference types="jest" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock ioredis
jest.mock('ioredis', () => {
  const IORedis = jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
  }));
  return IORedis;
});

// Mock bullmq
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

// Mock cache utilities
jest.mock('../utils/cache.ts', () => ({
    getCache: jest.fn().mockResolvedValue(null),
    setCache: jest.fn(),
}));

// Create mock Prisma client
const mockPrismaClient = {
  user: {
    create: jest.fn().mockImplementation((data: any) => Promise.resolve({ id: 'mock-user-id', ...data.data })),
    findUnique: jest.fn().mockImplementation(async (query: any) => {
      if (query.where.email === 'nonexistent@example.com') {
        return Promise.resolve(null);
      }
      const hashedPassword = await bcrypt.hash('password123', 10);
      return Promise.resolve({ id: 'mock-user-id', email: query.where.email, password: hashedPassword });
    }),
    findFirst: jest.fn().mockResolvedValue({ id: 'mock-user-id', email: 'test@example.com', password: 'hashed_password' }),
    update: jest.fn().mockResolvedValue({ id: 'mock-user-id' }),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  property: {
    create: jest.fn().mockImplementation((data: any) => Promise.resolve({ id: 'mock-property-id', ...data.data })),
    findMany: jest.fn().mockResolvedValue([{ id: 'mock-property-id', name: 'Test Property' }]),
    findUnique: jest.fn().mockImplementation((query: any) => {
        if (query.where.id === 'non-existent-id') {
            return Promise.resolve(null);
        }
        return Promise.resolve({ id: query.where.id, name: 'Test Property' })
    }),
    update: jest.fn().mockResolvedValue({ id: 'mock-property-id', name: 'Updated Property' }),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn(),
  },
  unit: {
    create: jest.fn().mockImplementation((data: any) => Promise.resolve({ id: 'mock-unit-id', ...data.data })),
    findMany: jest.fn().mockResolvedValue([{ id: 'mock-unit-id', unitNumber: 'A101' }]),
    findUnique: jest.fn().mockImplementation((query: any) => {
        if (query.where.id === 'non-existent-id') {
            return Promise.resolve(null);
        }
        return Promise.resolve({ id: query.where.id, unitNumber: 'A101' })
    }),
    update: jest.fn().mockResolvedValue({ id: 'mock-unit-id', monthlyRent: 1300, isOccupied: true }),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn(),
    count: jest.fn().mockResolvedValue(1),
  },
  lease: {
    create: jest.fn().mockImplementation((data: any) => Promise.resolve({ id: 'mock-lease-id', ...data.data })),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockImplementation((query: any) => {
        if (query.where.id === 'non-existent-id') {
            return Promise.resolve(null);
        }
        return Promise.resolve({ id: query.where.id, rentAmount: 1000, currency: 'usd' })
    }),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn(),
  },
  maintenanceRequest: {
    create: jest.fn().mockImplementation((data: any) => Promise.resolve({ id: 'mock-maintenance-id', ...data.data })),
    findMany: jest.fn().mockResolvedValue([{ id: 'mock-maintenance-id', title: 'Leaky faucet' }]),
    findUnique: jest.fn().mockImplementation((query: any) => {
        if (query.where.id === 'non-existent-id') {
            return Promise.resolve(null);
        }
        return Promise.resolve({ id: query.where.id, title: 'Leaky faucet' })
    }),
    update: jest.fn().mockResolvedValue({ id: 'mock-maintenance-id', status: 'COMPLETED' }),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn(),
  },
  tenantRating: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn(),
  },
  auditEntry: {
      create: jest.fn().mockResolvedValue({}),
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
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $queryRaw: jest.fn().mockResolvedValue([]),
  $queryRawUnsafe: jest.fn().mockResolvedValue([]),
};

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

export default mockPrismaClient;

// Mock authentication middleware
import { Request, Response, NextFunction } from 'express';

jest.mock('../middleware/authMiddleware', () => ({
  authMiddleware: {
    protect: (req: Request, res: Response, next: NextFunction) => {
      (req as any).user = { id: 'test-user-id', email: 'test@example.com' };
      next();
    },
    checkRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
      next();
    },
    admin: (req: Request, res: Response, next: NextFunction) => {
      next();
    }
  }
}));

// Mock PubSub service
jest.mock('../services/pubSub.service', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
  }))
}));

// Mock email service
jest.mock('../services/emailService', () => ({
  __esModule: true,
  sendRecoveryEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendEmail: jest.fn().mockResolvedValue(undefined)
}));

