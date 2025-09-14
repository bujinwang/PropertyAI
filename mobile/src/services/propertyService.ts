import axios, { AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Property, Unit, ApiResponse, PaginatedResponse } from '@/types';
import { API_CONFIG, API_ENDPOINTS } from '@/constants/api';

class PropertyService {
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

  async getProperties(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }): Promise<ApiResponse<PaginatedResponse<Property>>> {
    try {
      const response: AxiosResponse = await this.api.get(API_ENDPOINTS.PROPERTIES, {
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

  async getPropertyById(id: string): Promise<ApiResponse<Property>> {
    try {
      const response: AxiosResponse = await this.api.get(API_ENDPOINTS.PROPERTY_DETAILS(id));
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createProperty(propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Property>> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.PROPERTIES, propertyData);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateProperty(id: string, propertyData: Partial<Property>): Promise<ApiResponse<Property>> {
    try {
      const response: AxiosResponse = await this.api.put(API_ENDPOINTS.PROPERTY_DETAILS(id), propertyData);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async deleteProperty(id: string): Promise<ApiResponse<void>> {
    try {
      await this.api.delete(API_ENDPOINTS.PROPERTY_DETAILS(id));
      return {
        data: undefined,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPropertyUnits(propertyId: string): Promise<ApiResponse<Unit[]>> {
    try {
      const response: AxiosResponse = await this.api.get(`${API_ENDPOINTS.PROPERTY_DETAILS(propertyId)}/units`);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createUnit(propertyId: string, unitData: Omit<Unit, 'id' | 'propertyId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Unit>> {
    try {
      const response: AxiosResponse = await this.api.post(`${API_ENDPOINTS.PROPERTY_DETAILS(propertyId)}/units`, unitData);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateUnit(unitId: string, unitData: Partial<Unit>): Promise<ApiResponse<Unit>> {
    try {
      const response: AxiosResponse = await this.api.put(`/api/units/${unitId}`, unitData);
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

export const propertyService = new PropertyService();