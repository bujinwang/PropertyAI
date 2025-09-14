import { ssoService } from '../ssoService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('SSOService', () => {
  beforeEach(async () => {
    // Clear test data
    await prisma.sSOConfig.deleteMany();
    await prisma.oAuthConnection.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('configureProvider', () => {
    it('should configure SSO provider', async () => {
      const config = {
        provider: 'google',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/auth/google/callback',
        scopes: ['openid', 'email', 'profile'],
      };

      const provider = await ssoService.configureProvider(config);

      expect(provider.id).toBeDefined();
      expect(provider.name).toBe('google');
      expect(provider.clientId).toBe('test-client-id');
      expect(provider.clientSecret).toBe('test-client-secret');
      expect(provider.scopes).toEqual(['openid', 'email', 'profile']);
      expect(provider.isActive).toBe(true);
    });

    it('should update existing provider configuration', async () => {
      // Configure provider first
      const config1 = {
        provider: 'microsoft',
        clientId: 'old-client-id',
        clientSecret: 'old-secret',
        redirectUri: 'http://localhost:3000/auth/microsoft/callback',
      };

      await ssoService.configureProvider(config1);

      // Update configuration
      const config2 = {
        provider: 'microsoft',
        clientId: 'new-client-id',
        clientSecret: 'new-secret',
        redirectUri: 'http://localhost:3000/auth/microsoft/callback',
      };

      const updatedProvider = await ssoService.configureProvider(config2);

      expect(updatedProvider.clientId).toBe('new-client-id');
      expect(updatedProvider.clientSecret).toBe('new-secret');
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate authorization URL', async () => {
      const config = {
        provider: 'github',
        clientId: 'github-client-id',
        clientSecret: 'github-secret',
        redirectUri: 'http://localhost:3000/auth/github/callback',
      };

      await ssoService.configureProvider(config);

      const authUrl = await ssoService.getAuthorizationUrl('github');

      expect(authUrl).toContain('https://github.com/login/oauth/authorize');
      expect(authUrl).toContain('client_id=github-client-id');
      expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgithub%2Fcallback');
      expect(authUrl).toContain('scope=user%3Aemail%2Cread%3Auser');
    });

    it('should include state parameter', async () => {
      const config = {
        provider: 'google',
        clientId: 'google-client-id',
        clientSecret: 'google-secret',
        redirectUri: 'http://localhost:3000/auth/google/callback',
      };

      await ssoService.configureProvider(config);

      const authUrl = await ssoService.getAuthorizationUrl('google', 'test-state');

      expect(authUrl).toContain('state=test-state');
    });

    it('should throw error for unconfigured provider', async () => {
      await expect(ssoService.getAuthorizationUrl('unconfigured')).rejects.toThrow('SSO provider unconfigured not configured');
    });
  });

  describe('getConfiguredProviders', () => {
    it('should return configured providers', async () => {
      const config1 = {
        provider: 'google',
        clientId: 'google-client',
        clientSecret: 'google-secret',
        redirectUri: 'http://localhost:3000/auth/google/callback',
      };

      const config2 = {
        provider: 'microsoft',
        clientId: 'microsoft-client',
        clientSecret: 'microsoft-secret',
        redirectUri: 'http://localhost:3000/auth/microsoft/callback',
      };

      await ssoService.configureProvider(config1);
      await ssoService.configureProvider(config2);

      const providers = await ssoService.getConfiguredProviders();

      expect(providers).toHaveLength(2);
      expect(providers.map(p => p.name)).toEqual(expect.arrayContaining(['google', 'microsoft']));
    });

    it('should only return active providers', async () => {
      const config = {
        provider: 'github',
        clientId: 'github-client',
        clientSecret: 'github-secret',
        redirectUri: 'http://localhost:3000/auth/github/callback',
      };

      await ssoService.configureProvider(config);
      await ssoService.disableProvider('github');

      const providers = await ssoService.getConfiguredProviders();

      expect(providers).toHaveLength(0);
    });
  });

  describe('disableProvider', () => {
    it('should disable SSO provider', async () => {
      const config = {
        provider: 'google',
        clientId: 'google-client',
        clientSecret: 'google-secret',
        redirectUri: 'http://localhost:3000/auth/google/callback',
      };

      await ssoService.configureProvider(config);

      let providers = await ssoService.getConfiguredProviders();
      expect(providers).toHaveLength(1);

      await ssoService.disableProvider('google');

      providers = await ssoService.getConfiguredProviders();
      expect(providers).toHaveLength(0);
    });
  });

  describe('authenticateWithSSO', () => {
    it('should authenticate new user with SSO', async () => {
      // Mock the token exchange and user info
      const mockExchangeCode = jest.spyOn(ssoService as any, 'exchangeCodeForToken');
      mockExchangeCode.mockResolvedValue({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      });

      const mockGetUserInfo = jest.spyOn(ssoService as any, 'getUserInfo');
      mockGetUserInfo.mockResolvedValue({
        id: 'google-user-123',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        provider: 'google',
        providerId: 'google-user-123',
      });

      const result = await ssoService.authenticateWithSSO('google', 'mock-auth-code');

      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.firstName).toBe('New');
      expect(result.user.lastName).toBe('User');
      expect(result.isNewUser).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.sessionId).toBeDefined();

      // Verify user was created
      const createdUser = await prisma.user.findUnique({
        where: { email: 'newuser@example.com' }
      });
      expect(createdUser).toBeDefined();
      expect(createdUser?.ssoEnabled).toBe(true);
      expect(createdUser?.ssoProvider).toBe('google');

      mockExchangeCode.mockRestore();
      mockGetUserInfo.mockRestore();
    });

    it('should authenticate existing user with SSO', async () => {
      // Create existing user
      const existingUser = await prisma.user.create({
        data: {
          email: 'existing@example.com',
          password: 'hashed',
          firstName: 'Existing',
          lastName: 'User',
          role: 'TENANT',
        }
      });

      // Mock the token exchange and user info
      const mockExchangeCode = jest.spyOn(ssoService as any, 'exchangeCodeForToken');
      mockExchangeCode.mockResolvedValue({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      });

      const mockGetUserInfo = jest.spyOn(ssoService as any, 'getUserInfo');
      mockGetUserInfo.mockResolvedValue({
        id: 'google-existing-123',
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User',
        provider: 'google',
        providerId: 'google-existing-123',
      });

      const result = await ssoService.authenticateWithSSO('google', 'mock-auth-code');

      expect(result.user.id).toBe(existingUser.id);
      expect(result.isNewUser).toBe(false);
      expect(result.accessToken).toBeDefined();

      mockExchangeCode.mockRestore();
      mockGetUserInfo.mockRestore();
    });
  });
});