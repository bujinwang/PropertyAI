import axios, { AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { User, AuthTokens, LoginCredentials, RegisterData, ApiResponse } from '@/types';
import { API_CONFIG, API_ENDPOINTS } from '@/constants/api';

class AuthService {
  private api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
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

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      const { user, accessToken, refreshToken, expiresIn } = response.data.data;

      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer',
      };

      await this.storeTokens(tokens);
      await this.storeUser(user);

      return {
        data: { user, tokens },
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.AUTH.REGISTER, data);
      const { user, accessToken, refreshToken, expiresIn } = response.data.data;

      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer',
      };

      await this.storeTokens(tokens);
      await this.storeUser(user);

      return {
        data: { user, tokens },
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
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
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
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

      return {
        data: tokens,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse = await this.api.get(API_ENDPOINTS.AUTH.ME);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async enableMFA(): Promise<ApiResponse<{ secret: string; qrCode: string }>> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.AUTH.MFA.ENABLE);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async verifyMFA(code: string): Promise<ApiResponse<void>> {
    try {
      await this.api.post(API_ENDPOINTS.AUTH.MFA.VERIFY, { code });
      return {
        data: undefined,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async disableMFA(): Promise<ApiResponse<void>> {
    try {
      await this.api.post(API_ENDPOINTS.AUTH.MFA.DISABLE);
      return {
        data: undefined,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async oauthLogin(provider: 'google' | 'facebook', token: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.AUTH.OAUTH[provider.toUpperCase() as 'GOOGLE' | 'FACEBOOK'], {
        token,
      });

      const { user, accessToken, refreshToken, expiresIn } = response.data.data;

      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer',
      };

      await this.storeTokens(tokens);
      await this.storeUser(user);

      return {
        data: { user, tokens },
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

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

  private async clearStoredData(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync('auth_tokens'),
      SecureStore.deleteItemAsync('user_data'),
    ]);
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred';
      const apiError = new Error(message);
      (apiError as any).status = error.response.status;
      (apiError as any).code = error.response.data?.code;
      return apiError;
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export const authService = new AuthService();