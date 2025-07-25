import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import {
  User,
  WorkOrder,
  Message,
  WorkOrderQuote,
  LoginRequest,
  ApiResponse,
  WorkOrderStatus,
} from '../types';

// Configure base URL - you may want to adjust this based on your backend URL
const BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, clear stored token
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('user');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await this.api.post('/auth/login', credentials);
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      await this.api.post('/auth/logout');
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('user');
      return {};
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Work order endpoints
  async getWorkOrders(): Promise<ApiResponse<WorkOrder[]>> {
    try {
      const response = await this.api.get('/contractor/work-orders');
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getWorkOrderDetails(workOrderId: string): Promise<ApiResponse<WorkOrder>> {
    try {
      const response = await this.api.get(`/contractor/work-orders/${workOrderId}`);
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async acceptWorkOrder(workOrderId: string): Promise<ApiResponse<WorkOrder>> {
    try {
      const response = await this.api.post(`/contractor/work-orders/${workOrderId}/accept`);
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async declineWorkOrder(workOrderId: string): Promise<ApiResponse<void>> {
    try {
      await this.api.post(`/contractor/work-orders/${workOrderId}/decline`);
      return {};
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateWorkOrderStatus(
    workOrderId: string,
    status: WorkOrderStatus
  ): Promise<ApiResponse<WorkOrder>> {
    try {
      const response = await this.api.put(`/contractor/work-orders/${workOrderId}/status`, {
        status,
      });
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async submitQuote(
    workOrderId: string,
    amount: number,
    details: string
  ): Promise<ApiResponse<WorkOrderQuote>> {
    try {
      const response = await this.api.post(`/contractor/work-orders/${workOrderId}/quote`, {
        amount,
        details,
      });
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async submitInvoice(workOrderId: string, invoiceUrl: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post(`/contractor/work-orders/${workOrderId}/invoice`, {
        invoiceUrl,
      });
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Messaging endpoints
  async getMessages(workOrderId: string): Promise<ApiResponse<Message[]>> {
    try {
      const response = await this.api.get(`/contractor/work-orders/${workOrderId}/messages`);
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendMessage(workOrderId: string, content: string): Promise<ApiResponse<Message>> {
    try {
      const response = await this.api.post(`/contractor/work-orders/${workOrderId}/messages`, {
        content,
      });
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // File upload endpoint (for invoices/photos)
  async uploadFile(file: FormData): Promise<ApiResponse<{ url: string }>> {
    try {
      const response = await this.api.post('/upload', file, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse<never> {
    if (error.response) {
      // Server responded with error status
      return {
        error: error.response.data?.message || error.response.data?.error || 'Server error',
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        error: 'Network error. Please check your connection.',
      };
    } else {
      // Something else happened
      return {
        error: 'An unexpected error occurred.',
      };
    }
  }
}

export const apiService = new ApiService();
