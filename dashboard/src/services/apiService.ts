import axios, { AxiosRequestConfig } from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// This should be configured through environment variables for the dashboard
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper functions for token management in a web environment
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

const storeAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

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

// Create a class for API service
class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
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
      async (config: AxiosRequestConfig) => {
        if (!this.token) {
          this.token = getAuthToken();
        }
        if (this.token) {
          config.headers['Authorization'] = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling and token refresh
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: any) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const response = await axios.post<{ token: string }>(`${API_URL}/auth/refresh`, {}, {
              headers: {
                'Authorization': `Bearer ${this.token}`,
              }
            });
            const newToken = response.data.token;
            if (newToken) {
              this.token = newToken;
              storeAuthToken(newToken);
              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              }
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.token = null;
            localStorage.removeItem('authToken');
            return Promise.reject({
              message: 'Session expired. Please log in again.',
              status: 401,
              code: 'AUTH_REQUIRED',
            } as ApiError);
          }
        }

        const apiError: ApiError = {
          message: (error.response?.data as any)?.message || 'An unexpected error occurred',
          status: error.response?.status,
          code: (error.response?.data as any)?.code,
          errors: (error.response?.data as any)?.errors,
        };

        return Promise.reject(apiError);
      }
    );
  }

  public setToken(token: string): void {
    this.token = token;
    storeAuthToken(token);
  }

  public clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  public async get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get<T>(url, { ...config, params });
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleError(error as ApiError);
    }
  }

  public async post<T, D = Record<string, unknown>>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleError(error as ApiError);
    }
  }

  public async put<T, D = Record<string, unknown>>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleError(error as ApiError);
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete<T>(url, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleError(error as ApiError);
    }
  }

  public async createPaymentIntent(amount: number, currency: string, customerId?: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const response = await this.post<{ clientSecret: string; paymentIntentId: string }>('/payment-intents', { amount, currency, customerId });
      return response.data;
    } catch (error) {
      throw this.handleError(error as ApiError);
    }
  }

  public async getLeaseDetails(leaseId: string): Promise<any> {
    try {
      const response = await this.get<any>(`/leases/${leaseId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as ApiError);
    }
  }

  private handleError(error: ApiError): never {
    console.error('API Error:', error);
    throw error;
  }
}

export const apiService = new ApiService();
export default ApiService;
