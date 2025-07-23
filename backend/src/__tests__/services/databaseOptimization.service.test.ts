import { identifySlowQueries, analyzeQuery } from '../../services/databaseOptimization.service';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $queryRaw: jest.fn().mockResolvedValue([]),
      $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    })),
  };
});

describe('Database Optimization Service', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('identifySlowQueries', () => {
    it('should call prisma.$queryRaw with the correct query', async () => {
      await identifySlowQueries(5);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('analyzeQuery', () => {
    it('should call prisma.$queryRawUnsafe with the correct query', async () => {
      await analyzeQuery('SELECT * FROM users');
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith('EXPLAIN ANALYZE SELECT * FROM users');
    });
  });
});
