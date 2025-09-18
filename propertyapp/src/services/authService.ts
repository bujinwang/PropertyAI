import axios, { AxiosError, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL, API_CONFIG, API_ENDPOINTS } from '../constants/api';
import { User, AuthTokens, LoginCredentials, RegisterData, OAuthProvider, MFAVerificationResponse } from '../types/auth';
import { apiService } from './apiService';
import { storeRefreshToken } from '../utils/secureStorage';

// Define error types for better type safety
type ErrorWithResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

interface LoginResponse {
  token?: string;
  user?: User;
  requireMFA?: boolean;
  email?: string;
  message?: string;
}

interface OAuthLoginResponse {
  token?: string;
  user?: User;
  requireMFA?: boolean;
  email?: string;
  message?: string;
  url?: string; // URL to redirect for OAuth flow
}

class AuthService {
  private api = axios.create({
    baseURL: API_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await this.getStoredRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const newTokens = response.data;

              await this.storeTokens(newTokens);
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;

              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            await this.clearStoredData();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      
      // Backend returns data in a 'data' wrapper
      const loginData = response.data.data || response.data;
      const { user, accessToken, refreshToken, expiresIn } = loginData;
      
      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer',
      };

      await this.storeTokens(tokens);
      await this.storeUser(user);
      apiService.setToken(accessToken);

      return {
        token: accessToken,
        user,
        requireMFA: loginData.requireMFA,
        email: loginData.email,
        message: loginData.message,
      };
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      } else if ('response' in err && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  async register(data: RegisterData): Promise<{ token: string; user: User }> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.AUTH.REGISTER, data);
      
      const registerData = response.data.data || response.data;
      const { user, accessToken, refreshToken, expiresIn } = registerData;
      
      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer',
      };

      await this.storeTokens(tokens);
      await this.storeUser(user);
      apiService.setToken(accessToken);

      return {
        token: accessToken,
        user,
      };
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      } else if ('response' in err && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error('Registration failed. Please try again.');
    }
  }

  async verifyMFACode(email: string, code: string): Promise<MFAVerificationResponse> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.AUTH.MFA.VERIFY, {
        email,
        code
      });
      
      const mfaData = response.data.data || response.data;
      if (mfaData.token) {
        apiService.setToken(mfaData.token);
      }
      
      return mfaData;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      } else if ('response' in err && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error('MFA verification failed. Please try again.');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ data: AuthTokens }> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.AUTH.REFRESH, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;
      const tokens: AuthTokens = {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
        tokenType: 'Bearer',
      };

      await this.storeTokens(tokens);
      apiService.setToken(accessToken);

      return {
        data: tokens,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getUserProfile(): Promise<User> {
    try {
      const response = await apiService.get<User>('/auth/me');
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(err.message || 'Failed to get profile');
    }
  }

  async setupMFA(): Promise<{ secret: string; email: string }> {
    try {
      const response = await apiService.post<{ secret: string; email: string }>('/mfa/setup');
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(err.message || 'Failed to set up MFA');
    }
  }

  async enableMFA(code: string): Promise<{ message: string }> {
    try {
      const response = await apiService.post<{ message: string }>('/mfa/enable', { code });
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(err.message || 'Failed to enable MFA');
    }
  }

  async disableMFA(code: string): Promise<{ message: string }> {
    try {
      const response = await apiService.post<{ message: string }>('/mfa/disable', { code });
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(err.message || 'Failed to disable MFA');
    }
  }

  async getMFAStatus(): Promise<{ mfaEnabled: boolean }> {
    try {
      const response = await apiService.get<{ mfaEnabled: boolean }>('/mfa/status');
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(err.message || 'Failed to get MFA status');
    }
  }

  // OAuth login and callback don't use apiService because the user is not yet authenticated
  async loginWithOAuth(provider: OAuthProvider): Promise<OAuthLoginResponse> {
    try {
      const response = await axios.get(`${API_URL}/auth/oauth/${provider}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      } else if ('response' in err && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error(`Failed to login with ${provider}. Please try again.`);
    }
  }

  async handleOAuthCallback(provider: OAuthProvider, code: string): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/oauth/${provider}/callback`, { code });
      
      const oauthData = response.data.data || response.data;
      if (oauthData.token) {
        apiService.setToken(oauthData.token);
      }
      
      return oauthData;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      } else if ('response' in err && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error(`Failed to complete ${provider} login. Please try again.`);
    }
  }

  // Helper function to clear token on logout
  clearAuthToken = (): void => {
    apiService.clearToken();
  };

  // Forgot password doesn't use apiService because it doesn't require authentication
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      } else if ('response' in err && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error('Failed to process password reset request. Please try again.');
    }
  };

  // Reset password doesn't use apiService because it uses a special token
  async resetPassword(resetToken: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        token: resetToken,
        newPassword
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      } else if ('response' in err && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error('Failed to reset password. Please try again.');
    }
  };

  private async storeTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync('auth_tokens', JSON.stringify(tokens));
  }

  private async storeUser(user: User): Promise<void> {
    await SecureStore.setItemAsync('user_data', JSON.stringify(user));
  }

  private async getStoredToken(): Promise<string | null> {
    try {
      const tokensString = await SecureStore.getItemAsync('auth_tokens');
      if (tokensString) {
        const tokens: AuthTokens = JSON.parse(tokensString);
        return tokens.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async getStoredRefreshToken(): Promise<string | null> {
    try {
      const tokensString = await SecureStore.getItemAsync('auth_tokens');
      if (tokensString) {
        const tokens: AuthTokens = JSON.parse(tokensString);
        return tokens.refreshToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Even if logout fails on server, clear local data
      console.warn('Server logout failed:', error);
    } finally {
      await this.clearStoredData();
      apiService.clearToken();
    }
  }

  private async clearStoredData(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync('auth_tokens'),
      SecureStore.deleteItemAsync('user_data'),
    ]);
  }

  private handleError(error: unknown): Error {
    const err = error as AxiosError | ErrorWithResponse;
    if ('response' in err && err.response) {
      const message = err.response.data?.message || 'An error occurred';
      const apiError = new Error(message);
      apiError.status = err.response.status;
      apiError.code = err.response.data?.code;
      return apiError;
    } else if ('request' in err) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error((error as Error).message || 'An unexpected error occurred');
    }
  }
}

export const authService = new AuthService();