import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getRefreshToken, storeAuthToken, storeRefreshToken, clearAuthData, getAuthToken } from '../utils/secureStorage';
import { API_URL } from '../constants/api';
import { Permission } from '@/types/permissions';

// Define response interface for better typing
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Error interface for standardized error handling
interface ApiError {
  message: string;
  status?: number;
  code?: string;
  errors?: Record<string, string[]>;
}

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // in milliseconds
  resetTimeout?: number; // in milliseconds, optional timeout to reset on error
}

// Rate limiter class to handle request throttling
class RateLimiter {
  private requestTimes: Record<string, number[]> = {};
  private config: Record<string, RateLimitConfig> = {};
  private defaultConfig: RateLimitConfig = {
    maxRequests: 5,
    timeWindow: 1000, // 1 second
  };
  
  constructor() {
    // Define default rate limits for different endpoint categories
    this.config = {
      'default': this.defaultConfig,
      '/auth': {
        maxRequests: 5,
        timeWindow: 60000, // 1 minute
        resetTimeout: 3000, // 3 seconds on error
      },
      '/ai': {
        maxRequests: 2,
        timeWindow: 2000, // 2 seconds for AI endpoints (high server load)
        resetTimeout: 5000, // 5 seconds on error
      },
      '/uploads': {
        maxRequests: 3,
        timeWindow: 5000, // 5 seconds for uploads
        resetTimeout: 10000, // 10 seconds on error
      }
    };
  }
  
  // Get the appropriate rate limit config for a URL
  private getConfigForUrl(url: string): RateLimitConfig {
    // Find the matching config based on URL prefix
    for (const [prefix, config] of Object.entries(this.config)) {
      if (url.startsWith(prefix) && prefix !== 'default') {
        return config;
      }
    }
    return this.config.default;
  }
  
  // Check if a request can proceed or should be rate limited
  public async checkRateLimit(url: string): Promise<boolean> {
    const config = this.getConfigForUrl(url);
    const now = Date.now();
    
    // Initialize request times array for this URL if it doesn't exist
    if (!this.requestTimes[url]) {
      this.requestTimes[url] = [];
    }
    
    // Filter out old requests outside the time window
    this.requestTimes[url] = this.requestTimes[url].filter(
      time => now - time < config.timeWindow
    );
    
    // Check if we've exceeded the maximum requests in the time window
    if (this.requestTimes[url].length >= config.maxRequests) {
      console.warn(`Rate limit exceeded for ${url}. Max ${config.maxRequests} requests in ${config.timeWindow}ms.`);
      
      // Calculate wait time until next request can be made
      const oldestRequest = Math.min(...this.requestTimes[url]);
      const waitTime = Math.max(0, config.timeWindow - (now - oldestRequest));
      
      // Return false immediately if wait time is 0 (shouldn't happen but for safety)
      if (waitTime <= 0) {
        return true;
      }
      
      // Wait for the specified time before allowing the request
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Remove the oldest request time
      this.requestTimes[url] = this.requestTimes[url].slice(1);
      
      // Add the current time
      this.requestTimes[url].push(Date.now());
      return true;
    }
    
    // Add current request time to the array
    this.requestTimes[url].push(now);
    return true;
  }
  
  // Handle rate limit error by setting a timeout
  public handleRateLimitError(url: string): void {
    const config = this.getConfigForUrl(url);
    
    if (config.resetTimeout) {
      // Clear existing request times and set a timeout before allowing new requests
      this.requestTimes[url] = [];
      
      // Schedule a cleanup of the request times after the reset timeout
      setTimeout(() => {
        this.requestTimes[url] = [];
      }, config.resetTimeout);
    }
  }
}

// Create a class for API service
class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;
  private rateLimiter: RateLimiter;
  
  constructor() {
    this.rateLimiter = new RateLimiter();
    
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Add request interceptor for authentication
    this.api.interceptors.request.use(
      async (config) => {
        // Apply rate limiting
        if (config.url) {
          await this.rateLimiter.checkRateLimit(config.url);
        }
        
        // If token not loaded, try to get it from secure storage
        if (!this.token) {
          this.token = await getAuthToken();
        }
        
        // If we have a token, add it to the request headers
        if (this.token) {
          config.headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor for error handling and token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // Handle rate limit errors (429 Too Many Requests)
        if (error.response?.status === 429 && originalRequest.url) {
          // Handle rate limit error
          this.rateLimiter.handleRateLimitError(originalRequest.url);
          
          // Return a friendly error
          return Promise.reject({
            message: 'Rate limit exceeded. Please try again later.',
            status: 429,
            code: 'RATE_LIMIT_EXCEEDED',
          } as ApiError);
        }
        
        // Handle 401 Unauthorized errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Call token refresh endpoint
            const response = await axios.post<{ token: string }>(`${API_URL}/auth/refresh`, {}, {
              headers: {
                'Authorization': `Bearer ${this.token}`,
              }
            });
            
            // Update token
            const newToken = response.data.token;
            if (newToken) {
              this.token = newToken;
              await storeAuthToken(newToken);
              
              // Update the original request with new token
              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              }
              
              // Retry the original request
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // If refresh token failed, clear token and reject
            this.token = null;
            return Promise.reject({
              message: 'Session expired. Please log in again.',
              status: 401,
              code: 'AUTH_REQUIRED',
            } as ApiError);
          }
        }
        
        // Handle API errors with consistent format
        const apiError: ApiError = {
          message: error.response?.data?.message || 'An unexpected error occurred',
          status: error.response?.status,
          code: error.response?.data?.code as string | undefined,
          errors: error.response?.data?.errors as Record<string, string[]> | undefined,
        };
        
        return Promise.reject(apiError);
      }
    );
  }
  
  // Method to manually set token (useful for login/register)
  public setToken(token: string): void {
    this.token = token;
  }
  
  // Method to clear token (useful for logout)
  public clearToken(): void {
    this.token = null;
  }
  
  // GET request method
  public async get<T>(
    url: string, 
    params?: Record<string, unknown>,
    requiredPermissions?: Permission[],
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      // Check if user has required permissions (can be implemented via middleware on server)
      if (requiredPermissions && requiredPermissions.length > 0) {
        // Include permissions in request headers for server validation
        const mergedConfig = {
          ...config,
          headers: {
            ...config?.headers,
            'X-Required-Permissions': requiredPermissions.join(','),
          },
          params,
        };
        
        const response = await this.api.get<T>(url, mergedConfig);
        return {
          data: response.data,
          status: response.status,
        };
      }
      
      // No permissions required
      const response = await this.api.get<T>(url, { ...config, params });
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleError(error as ApiError);
    }
  }
  
  // POST request method
  public async post<T, D = Record<string, unknown>>(
    url: string, 
    data?: D, 
    requiredPermissions?: Permission[],
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      // Check if user has required permissions
      if (requiredPermissions && requiredPermissions.length > 0) {
        // Include permissions in request headers for server validation
        const mergedConfig = {
          ...config,
          headers: {
            ...config?.headers,
            'X-Required-Permissions': requiredPermissions.join(','),
          },
        };
        
        const response = await this.api.post<T>(url, data, mergedConfig);
        return {
          data: response.data,
          status: response.status,
        };
      }
      
      // No permissions required
      const response = await this.api.post<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleError(error as ApiError);
    }
  }
  
  // PUT request method
  public async put<T, D = Record<string, unknown>>(
    url: string, 
    data?: D, 
    requiredPermissions?: Permission[],
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      // Check if user has required permissions
      if (requiredPermissions && requiredPermissions.length > 0) {
        // Include permissions in request headers for server validation
        const mergedConfig = {
          ...config,
          headers: {
            ...config?.headers,
            'X-Required-Permissions': requiredPermissions.join(','),
          },
        };
        
        const response = await this.api.put<T>(url, data, mergedConfig);
        return {
          data: response.data,
          status: response.status,
        };
      }
      
      // No permissions required
      const response = await this.api.put<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleError(error as ApiError);
    }
  }
  
  // DELETE request method
  public async delete<T>(
    url: string, 
    requiredPermissions?: Permission[],
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      // Check if user has required permissions
      if (requiredPermissions && requiredPermissions.length > 0) {
        // Include permissions in request headers for server validation
        const mergedConfig = {
          ...config,
          headers: {
            ...config?.headers,
            'X-Required-Permissions': requiredPermissions.join(','),
          },
        };
        
        const response = await this.api.delete<T>(url, mergedConfig);
        return {
          data: response.data,
          status: response.status,
        };
      }
      
      // No permissions required
      const response = await this.api.delete<T>(url, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleError(error as ApiError);
    }
  }
  
  // Helper method to handle errors consistently
  private handleError(error: ApiError): never {
    // Log error for debugging
    console.error('API Error:', error);
    
    // Handle specific error codes
    switch (error.code) {
      case 'AUTH_REQUIRED':
        // Handle authentication required errors
        // Could trigger navigation to login screen
        break;
      case 'PERMISSION_DENIED':
        // Handle permission denied errors
        break;
      case 'RATE_LIMIT_EXCEEDED':
        // Handle rate limiting errors
        break;
      case 'VALIDATION_FAILED':
        // Handle validation errors
        break;
    }
    
    throw error;
  }
  
  // Add the refreshToken method inside the class
  private async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }
      
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken
      });
      
      const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
      
      // Store new tokens
      await storeAuthToken(newAccessToken);
      await storeRefreshToken(newRefreshToken);
      
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear all auth data on refresh failure
      await clearAuthData();
      throw new Error('Session expired');
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export the class for testing or special use cases
export default ApiService;