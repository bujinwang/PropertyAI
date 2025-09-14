import axios, { AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { MaintenanceRequest, ApiResponse, PaginatedResponse } from '@/types';
import { API_CONFIG, API_ENDPOINTS } from '@/constants/api';

class MaintenanceService {
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
              // TODO: Implement token refresh
              // const response = await authService.refreshToken(refreshToken);
              // const newTokens = response.data;
              // await this.storeTokens(newTokens);
              // originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              // return this.api(originalRequest);
            }
          } catch (refreshError) {
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async getMaintenanceRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    propertyId?: string;
    unitId?: string;
  }): Promise<ApiResponse<PaginatedResponse<MaintenanceRequest>>> {
    try {
      const response: AxiosResponse = await this.api.get(API_ENDPOINTS.MAINTENANCE.REQUESTS, {
        params,
      });
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getMaintenanceRequestById(id: string): Promise<ApiResponse<MaintenanceRequest>> {
    try {
      const response: AxiosResponse = await this.api.get(API_ENDPOINTS.MAINTENANCE.REQUEST_DETAILS(id));
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createMaintenanceRequest(requestData: {
    unitId: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    images?: string[];
  }): Promise<ApiResponse<MaintenanceRequest>> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.MAINTENANCE.CREATE, requestData);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateMaintenanceRequest(id: string, updateData: Partial<MaintenanceRequest>): Promise<ApiResponse<MaintenanceRequest>> {
    try {
      const response: AxiosResponse = await this.api.put(API_ENDPOINTS.MAINTENANCE.REQUEST_DETAILS(id), updateData);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateMaintenanceStatus(id: string, status: string, notes?: string): Promise<ApiResponse<MaintenanceRequest>> {
    try {
      const response: AxiosResponse = await this.api.put(API_ENDPOINTS.MAINTENANCE.UPDATE_STATUS(id), {
        status,
        notes,
      });
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async uploadMaintenancePhotos(id: string, photos: string[]): Promise<ApiResponse<void>> {
    try {
      const formData = new FormData();

      photos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo,
          type: 'image/jpeg',
          name: `photo_${index}.jpg`,
        } as any);
      });

      await this.api.post(API_ENDPOINTS.MAINTENANCE.UPLOAD_PHOTOS(id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        data: undefined,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getMaintenanceStats(): Promise<ApiResponse<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }>> {
    try {
      const response: AxiosResponse = await this.api.get('/api/maintenance/stats');
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

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

  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      const apiError = new Error(message);
      (apiError as any).status = error.response.status;
      (apiError as any).code = error.response.data?.code;
      return apiError;
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export const maintenanceService = new MaintenanceService();