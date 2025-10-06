// @ts-nocheck

jest.mock('../utils/cache');
jest.mock('../services/pubSub.service', () => ({
  pubSubService: {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
  }
}));
jest.mock('../services/audit.service', () => ({
  auditService: {
    logEvent: jest.fn().mockResolvedValue(undefined),
    logDataAccess: jest.fn().mockResolvedValue(undefined),
    getAuditLogs: jest.fn().mockResolvedValue([]),
  }
}));
jest.mock('../services/emailService');

beforeEach(() => {
  jest.clearAllMocks();

  const cacheModule = require('../utils/cache');
  cacheModule.getCache = jest.fn().mockResolvedValue(null);
  cacheModule.setCache = jest.fn().mockResolvedValue(undefined);
  cacheModule.cacheMiddleware = jest.fn().mockImplementation((req, res, next) => next());
  cacheModule.clearCache = jest.fn().mockResolvedValue(undefined);

  // Removed emailService mocks as the file does not exist
});
