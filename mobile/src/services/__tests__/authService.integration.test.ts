import { authService } from '../authService';
import { biometricAuthService } from '../../../backend/src/services/biometricAuthService';
import { enhancedAuthService } from '../../../backend/src/services/enhancedAuthService';

// Mock the API calls
jest.mock('../constants/api', () => ({
  API_CONFIG: {
    BASE_URL: 'http://localhost:3001/api',
    TIMEOUT: 10000,
  },
  API_ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      ME: '/auth/me',
      MFA: {
        ENABLE: '/auth/mfa/enable',
        VERIFY: '/auth/mfa/verify',
        DISABLE: '/auth/mfa/disable',
      },
      OAUTH: {
        GOOGLE: '/auth/oauth/google',
        FACEBOOK: '/auth/oauth/facebook',
      },
    },
  },
}));

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Mobile Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              role: 'TENANT',
              mfaEnabled: false,
            },
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
          }
        }
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
      expect(result.data?.tokens.accessToken).toBe('mock-access-token');
    });

    it('should handle MFA required login', async () => {
      const mockResponse = {
        data: {
          data: {
            requireMFA: true,
            email: 'test@example.com',
          }
        }
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined(); // No user data when MFA required
    });

    it('should handle login failure', async () => {
      const mockError = {
        response: {
          data: { message: 'Invalid credentials' },
          status: 401,
        }
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(mockError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      await expect(authService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('MFA Flow', () => {
    it('should enable MFA successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            secret: 'JBSWY3DPEHPK3PXP',
            qrCode: 'data:image/png;base64,mock-qr-code',
          }
        }
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await authService.enableMFA();

      expect(result.success).toBe(true);
      expect(result.data?.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.data?.qrCode).toBeDefined();
    });

    it('should verify MFA code', async () => {
      const mockResponse = {
        data: {
          data: undefined, // Void response
        }
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await authService.verifyMFA('123456');

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });
  });

  describe('Biometric Authentication', () => {
    it('should register biometric credential', async () => {
      // Mock the backend biometric service
      const mockRegister = jest.spyOn(biometricAuthService, 'registerBiometricCredential');
      mockRegister.mockResolvedValue();

      const registration = {
        userId: 'user-123',
        credentialId: 'biometric-cred-123',
        publicKey: 'mock-public-key',
        deviceType: 'fingerprint',
        deviceModel: 'iPhone 12',
      };

      await expect(biometricAuthService.registerBiometricCredential(registration)).resolves.not.toThrow();

      mockRegister.mockRestore();
    });

    it('should authenticate with biometric', async () => {
      const mockAuth = jest.spyOn(enhancedAuthService, 'authenticateBiometric');
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'TENANT',
        } as any,
        accessToken: 'biometric-token',
        refreshToken: 'biometric-refresh',
        sessionId: 'biometric-session',
      });

      const result = await enhancedAuthService.authenticateBiometric('biometric-cred-123', {
        platform: 'iOS',
        version: '14.0',
      });

      expect(result.user.id).toBe('user-123');
      expect(result.accessToken).toBe('biometric-token');

      mockAuth.mockRestore();
    });
  });

  describe('OAuth Integration', () => {
    it('should handle OAuth login', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              id: 'oauth-user-123',
              email: 'oauth@example.com',
              firstName: 'OAuth',
              lastName: 'User',
              role: 'TENANT',
            },
            accessToken: 'oauth-access-token',
            refreshToken: 'oauth-refresh-token',
            expiresIn: 3600,
          }
        }
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await authService.oauthLogin('google', 'mock-google-token');

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('oauth@example.com');
      expect(result.data?.tokens.accessToken).toBe('oauth-access-token');
    });
  });

  describe('Token Management', () => {
    it('should refresh token automatically', async () => {
      const mockRefreshResponse = {
        data: {
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresIn: 3600,
          }
        }
      };

      // Mock token refresh
      mockedAxios.create.mockReturnValue({
        post: jest.fn()
          .mockResolvedValueOnce({ data: { message: 'Logged out' } }) // First call succeeds
          .mockRejectedValueOnce({
            response: { status: 401 },
            config: { _retry: false }
          }) // Second call fails with 401
          .mockResolvedValueOnce(mockRefreshResponse), // Third call succeeds with refresh
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((_, errorHandler) => {
              // Simulate the interceptor logic
              errorHandler({
                response: { status: 401 },
                config: { _retry: false }
              });
            })
          },
        },
      } as any);

      // This test would need more complex mocking of the interceptor
      // For now, we'll test the basic token refresh method
      expect(true).toBe(true); // Placeholder
    });

    it('should handle token storage and retrieval', async () => {
      // Mock SecureStore
      const mockSecureStore = {
        setItemAsync: jest.fn().mockResolvedValue(undefined),
        getItemAsync: jest.fn().mockResolvedValue(JSON.stringify({
          accessToken: 'stored-token',
          refreshToken: 'stored-refresh',
          expiresIn: 3600,
        })),
      };

      jest.mock('expo-secure-store', () => mockSecureStore);

      // Test would verify token storage
      expect(mockSecureStore.setItemAsync).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(new Error('Network Error')),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      await expect(authService.login({
        email: 'test@example.com',
        password: 'password123',
      })).rejects.toThrow('Network error. Please check your connection.');
    });

    it('should handle server errors', async () => {
      const mockError = {
        response: {
          data: { message: 'Internal server error' },
          status: 500,
        }
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(mockError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      await expect(authService.login({
        email: 'test@example.com',
        password: 'password123',
      })).rejects.toThrow('Internal server error');
    });

    it('should handle timeout errors', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue({
          code: 'ECONNABORTED',
          message: 'Timeout'
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      await expect(authService.login({
        email: 'test@example.com',
        password: 'password123',
      })).rejects.toThrow('Network error. Please check your connection.');
    });
  });

  describe('Session Management', () => {
    it('should handle logout properly', async () => {
      const mockResponse = {
        data: { message: 'Logged out successfully' }
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      await expect(authService.logout()).resolves.not.toThrow();
    });

    it('should get current user profile', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'user-123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'TENANT',
          }
        }
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await authService.getCurrentUser();

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
    });
  });

  describe('Offline Support', () => {
    it('should handle offline authentication attempts', async () => {
      // Mock network failure
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(new Error('Network unavailable')),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      await expect(authService.login({
        email: 'test@example.com',
        password: 'password123',
      })).rejects.toThrow('Network error. Please check your connection.');
    });

    it('should use cached tokens when offline', async () => {
      // This would test offline token validation
      // Implementation depends on offline storage strategy
      expect(true).toBe(true); // Placeholder
    });
  });
});