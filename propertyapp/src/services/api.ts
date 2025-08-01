import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuthToken, getRefreshToken, storeAuthToken, storeRefreshToken, clearAuthData } from '@/utils/secureStorage';
import { API_URL } from '../constants/api';

// Use API_URL from constants which points to localhost:3001/api

// Error types
export enum AuthErrorType {
  INVALID_TOKEN = 'invalid_token',
  EXPIRED_TOKEN = 'expired_token',
  INVALID_REFRESH = 'invalid_refresh',
  SERVER_ERROR = 'server_error',
  UNKNOWN_ERROR = 'unknown_error',
}

// Authentication error class
export class AuthError extends Error {
  type: AuthErrorType;

  constructor(message: string, type: AuthErrorType) {
    super(message);
    this.type = type;
    this.name = 'AuthError';
  }
}

// Create API service class
class ApiService {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseURL: string) {
    // Create axios instance
    this.instance = axios.create({
      baseURL,
      timeout: 15000, // 15 seconds
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Set up request interceptor
    this.instance.interceptors.request.use(
      async (config) => {
        // Don't add token to non-authenticated endpoints
        if (config.url?.includes('/auth/') && !config.url?.includes('/auth/refresh')) {
          return config;
        }

        // Get token from secure storage
        const token = await getAuthToken();
        
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Set up response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Get original request configuration
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        if (!originalRequest) {
          return Promise.reject(error);
        }

        // Handle 401 Unauthorized errors (token expired)
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/refresh')
        ) {
          if (this.isRefreshing) {
            // If already refreshing, add to queue
            return new Promise<AxiosResponse>((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                // Replace old token with new token and retry
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.instance(originalRequest));
              });
            });
          }

          // Set refreshing flag
          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Attempt to refresh the token
            const newToken = await this.refreshToken();
            
            // Update Authorization header
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            
            // Process queued requests
            this.onTokenRefreshed(newToken);
            
            // Retry original request
            return this.instance(originalRequest);
          } catch (refreshError) {
            // Handle refresh token error
            this.onRefreshFailure(refreshError as Error);
            
            // Throw authentication error
            throw new AuthError(
              'Your session has expired. Please log in again.',
              AuthErrorType.EXPIRED_TOKEN
            );
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  // Add subscriber to token refresh
  private onTokenRefreshed(token: string): void {
    // Process all queued requests with new token
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  // Handle refresh token failure
  private onRefreshFailure(error: Error): void {
    // Reject all queued requests
    this.refreshSubscribers.forEach((callback) => callback(''));
    this.refreshSubscribers = [];
    
    // Log error
    console.error('Token refresh failed:', error);
    
    // Clear auth data (logout)
    clearAuthData().catch(console.error);
  }

  // Refresh authentication token
  private async refreshToken(): Promise<string> {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.instance.post('/auth/refresh', {
        refreshToken
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      // Store new tokens
      await storeAuthToken(accessToken);
      await storeRefreshToken(newRefreshToken);
      
      return accessToken;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new AuthError(
          'Refresh token expired or invalid',
          AuthErrorType.INVALID_REFRESH
        );
      }
      
      console.error('Token refresh failed:', error);
      throw new AuthError(
        'Failed to refresh token',
        AuthErrorType.SERVER_ERROR
      );
    }
  }

  // Format API errors
  private handleApiError(error: AxiosError): Error {
    if (error.response) {
      // The request was made and the server responded with a status code
      // outside of the 2xx range
      const status = error.response.status;
      const data = error.response.data as { message?: string };
      
      // Handle different status codes
      switch (status) {
        case 400:
          return new Error(data?.message || 'Invalid request');
        case 401:
          return new AuthError(
            data?.message || 'Unauthorized',
            AuthErrorType.INVALID_TOKEN
          );
        case 403:
          return new Error(data?.message || 'Forbidden');
        case 404:
          return new Error(data?.message || 'Resource not found');
        case 500:
          return new AuthError(
            'A server error occurred. Please try again later.',
            AuthErrorType.SERVER_ERROR
          );
        default:
          return new Error(data?.message || `An error occurred (status: ${status})`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error: No response received from server. Request details:', error.request);
      return new Error('No response from server. Please check your internet connection.');
    } else {
      // Something else happened while setting up the request
      console.error('API Error: Unexpected error during request setup:', error.message);
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Public methods for API calls
  
  // GET request
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }
  
  // POST request
  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }
  
  // PUT request
  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }
  
  // PATCH request
  public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }
  
  // DELETE request
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }
}

// Create and export API service instance
export const api = new ApiService(API_URL);

// Specific API calls
export const getPublicListings = (query?: string) => {
  return api.get('/properties/public/listings', { params: { search: query } });
};

export const getPropertyDetails = (propertyId: string) => {
  return api.get(`/properties/${propertyId}`);
};

// Export default instance
export default api;
