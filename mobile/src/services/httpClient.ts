import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '@/constants/api';

/**
 * Centralized HTTP client with automatic token refresh
 * All services should use this client for API requests
 */
class HttpClient {
  private api: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token to all requests
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle token refresh on 401
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Check if error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Get new token via refresh
            const newToken = await this.handleTokenRefresh();
            
            // Update authorization header with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            // Retry the original request with new token
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear auth data and reject
            await this.clearStoredData();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle token refresh with request deduplication
   * Multiple concurrent requests won't trigger multiple refresh calls
   */
  private async handleTokenRefresh(): Promise<string> {
    // If refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start new refresh
    this.refreshPromise = this.performTokenRefresh();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      // Clear refresh promise when done
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<string> {
    const refreshToken = await this.getStoredRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Call refresh endpoint WITHOUT the interceptor (to avoid infinite loop)
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/auth/refresh`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: API_CONFIG.TIMEOUT,
        }
      );

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;

      // Store new tokens
      const tokens = {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
        tokenType: 'Bearer',
      };

      await SecureStore.setItemAsync('auth_tokens', JSON.stringify(tokens));

      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh authentication token');
    }
  }

  /**
   * Get the stored access token
   */
  private async getStoredToken(): Promise<string | null> {
    try {
      const tokensString = await SecureStore.getItemAsync('auth_tokens');
      if (tokensString) {
        const tokens = JSON.parse(tokensString);
        return tokens.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get the stored refresh token
   */
  private async getStoredRefreshToken(): Promise<string | null> {
    try {
      const tokensString = await SecureStore.getItemAsync('auth_tokens');
      if (tokensString) {
        const tokens = JSON.parse(tokensString);
        return tokens.refreshToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Clear stored authentication data
   */
  private async clearStoredData(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('auth_tokens'),
        SecureStore.deleteItemAsync('user_data'),
      ]);
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  }

  /**
   * Get the axios instance for making requests
   */
  public getInstance(): AxiosInstance {
    return this.api;
  }

  /**
   * Manually trigger token refresh (useful for proactive refresh)
   */
  public async refreshToken(): Promise<void> {
    await this.handleTokenRefresh();
  }
}

// Export singleton instance
export const httpClient = new HttpClient();

// Export the axios instance for direct use
export default httpClient.getInstance();
