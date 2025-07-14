import { DatabaseOptimizationService } from '../../services/databaseOptimization.service';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $queryRaw: jest.fn().mockResolvedValue([]),
      $executeRawUnsafe: jest.fn().mockResolvedValue([]),
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ 'QUERY PLAN': [{}] }])
    }))
  };
});

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      quit: jest.fn().mockResolvedValue('OK')
    }))
  };
});

jest.mock('mongoose', () => {
  return {
    connection: {
      db: {
        command: jest.fn().mockResolvedValue({ ok: 1 }),
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            toArray: jest.fn().mockResolvedValue([])
          }),
          indexes: jest.fn().mockResolvedValue([])
        }),
        listCollections: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        })
      }
    }
  };
});

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('{}')
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/mock/path')
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('DatabaseOptimizationService', () => {
  let service: DatabaseOptimizationService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    mockRedis = new Redis();
    service = new DatabaseOptimizationService(mockPrisma, 'redis://localhost:6379');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzePostgresSlowQueries', () => {
    it('should analyze PostgreSQL slow queries', async () => {
      // Mock the query response
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          query: 'SELECT * FROM users',
          calls: 100,
          total_exec_time: 5000,
          mean_exec_time: 50
        }
      ]);

      const result = await service.analyzePostgresSlowQueries();

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('CREATE EXTENSION IF NOT EXISTS pg_stat_statements')
      );
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].query).toBe('SELECT * FROM users');
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.analyzePostgresSlowQueries()).rejects.toThrow('Database error');
    });
  });

  describe('createMissingIndexes', () => {
    it('should suggest missing indexes without executing when execute=false', async () => {
      // Mock the query response for PostgreSQL missing indexes
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          table_name: 'users',
          column_name: 'email'
        }
      ]);

      const result = await service.createMissingIndexes(false);

      expect(result).toContain(expect.stringMatching(/CREATE INDEX.*ON users/));
      // Should not execute the CREATE INDEX statement
      expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX')
      );
    });

    it('should create indexes when execute=true', async () => {
      // Mock the query response for PostgreSQL missing indexes
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          table_name: 'users',
          column_name: 'email'
        }
      ]);

      const result = await service.createMissingIndexes(true);

      expect(result).toContain(expect.stringMatching(/CREATE INDEX.*ON users/));
      // Should execute the CREATE INDEX statement
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX')
      );
    });
  });

  describe('detectUnusedIndexes', () => {
    it('should detect unused PostgreSQL indexes', async () => {
      // Mock the query responses
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          table_name: 'old_logs',
          index_name: 'idx_old_logs_timestamp',
          idx_scan: 0,
          index_size: '15 MB'
        }
      ]).mockResolvedValueOnce([]);

      const result = await service.detectUnusedIndexes();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('unused');
      expect(result[0].table_name).toBe('old_logs');
      expect(result[0].recommendation).toContain('DROP INDEX');
    });
  });

  describe('analyzeQueryPlans', () => {
    it('should analyze query plans', async () => {
      // Mock the slow queries
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          query: 'SELECT * FROM users',
          calls: 100,
          total_exec_time: 5000,
          mean_exec_time: 50,
          rows: 1000
        }
      ]);

      // Mock the query plan
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([
        {
          'QUERY PLAN': [
            {
              Plan: {
                'Node Type': 'Seq Scan',
                'Relation Name': 'users',
                'Actual Rows': 1000,
                'Total Cost': 100
              }
            }
          ]
        }
      ]);

      const result = await service.analyzeQueryPlans(false);

      expect(result).toHaveLength(1);
      expect(result[0].analysis).toContainEqual(
        expect.objectContaining({
          type: 'sequential_scan',
          recommendation: expect.stringContaining('Consider adding an index')
        })
      );
    });
  });

  describe('runHealthCheck', () => {
    it('should return health check data for PostgreSQL and MongoDB', async () => {
      // Mock PostgreSQL queries
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ connection_test: 1 }])
        .mockResolvedValueOnce([{
          active_connections: 10,
          database_size: '1 GB',
          table_count: 20,
          max_connections: 100
        }])
        .mockResolvedValueOnce([{ tables_needing_vacuum: 2 }]);

      // Mock MongoDB commands
      (mongoose.connection.db!.command as jest.Mock)
        .mockResolvedValueOnce({ ok: 1 }) // ping
        .mockResolvedValueOnce({ // dbStats
          dataSize: 1024 * 1024 * 1024, // 1GB
          indexes: 30,
          connections: 5
        })
        .mockResolvedValueOnce({ ok: 1 }); // connectionStatus

      const result = await service.runHealthCheck();

      expect(result.postgres.status).toBe('connected');
      expect(result.mongodb.status).toBe('connected');
      expect(result.postgres.metrics).toHaveProperty('active_connections');
      expect(result.mongodb.metrics).toHaveProperty('database_size');
    });
  });
}); 