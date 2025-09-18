// @ts-nocheck

jest.mock('../utils/cache');
jest.mock('../services/pubSub.service');
jest.mock('../services/emailService');

beforeEach(() => {
  jest.clearAllMocks();

  const cacheModule = require('../utils/cache');
  cacheModule.getCache = jest.fn().mockResolvedValue(null);
  cacheModule.setCache = jest.fn().mockResolvedValue(undefined);
  cacheModule.cacheMiddleware = jest.fn().mockImplementation((req, res, next) => next());
  cacheModule.clearCache = jest.fn().mockResolvedValue(undefined);

  const pubSubModule = require('../services/pubSub.service');
  pubSubModule.pubSubService.publish = jest.fn().mockResolvedValue(undefined);
  pubSubModule.pubSubService.subscribe = jest.fn().mockResolvedValue(undefined);
  pubSubModule.pubSubService.unsubscribe = jest.fn().mockResolvedValue(undefined);

  // Removed emailService mocks as the file does not exist
});
