import { jest } from '@jest/globals';

jest.mock('@prisma/client', () => {
  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(),
    },
    tenantIssuePrediction: {
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback: any) => {
      return callback(mockPrisma);
    }),
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});
