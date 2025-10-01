import { AxiosResponse } from 'axios';
import { PaymentMethod, PaymentTransaction, ApiResponse, PaginatedResponse } from '@/types';
import { API_ENDPOINTS } from '@/constants/api';
import httpClient from './httpClient';

class PaymentService {
  private api = httpClient;

  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    try {
      const response: AxiosResponse = await this.api.get(API_ENDPOINTS.PAYMENTS.METHODS);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async addPaymentMethod(methodData: {
    type: 'card' | 'bank_account';
    card?: {
      number: string;
      expMonth: number;
      expYear: number;
      cvc: string;
      holderName: string;
    };
    bankAccount?: {
      routingNumber: string;
      accountNumber: string;
      accountType: 'checking' | 'savings';
      holderName: string;
    };
    billingAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  }): Promise<ApiResponse<PaymentMethod>> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.PAYMENTS.METHODS, methodData);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updatePaymentMethod(id: string, updateData: Partial<PaymentMethod>): Promise<ApiResponse<PaymentMethod>> {
    try {
      const response: AxiosResponse = await this.api.put(`${API_ENDPOINTS.PAYMENTS.METHODS}/${id}`, updateData);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async deletePaymentMethod(id: string): Promise<ApiResponse<void>> {
    try {
      await this.api.delete(`${API_ENDPOINTS.PAYMENTS.METHODS}/${id}`);
      return {
        data: undefined,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async setDefaultPaymentMethod(id: string): Promise<ApiResponse<void>> {
    try {
      await this.api.put(`${API_ENDPOINTS.PAYMENTS.METHODS}/${id}/default`);
      return {
        data: undefined,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPaymentTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PaginatedResponse<PaymentTransaction>>> {
    try {
      const response: AxiosResponse = await this.api.get(API_ENDPOINTS.PAYMENTS.TRANSACTIONS, {
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

  async processPayment(paymentData: {
    amount: number;
    currency: string;
    paymentMethodId: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<PaymentTransaction>> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.PAYMENTS.PROCESS, paymentData);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createPaymentIntent(intentData: {
    amount: number;
    currency: string;
    paymentMethodId: string;
    description?: string;
  }): Promise<ApiResponse<{ clientSecret: string; paymentIntentId: string }>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/payments/create-intent', intentData);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getRecurringPayments(): Promise<ApiResponse<any[]>> {
    try {
      const response: AxiosResponse = await this.api.get(API_ENDPOINTS.PAYMENTS.RECURRING);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async setupRecurringPayment(recurringData: {
    amount: number;
    currency: string;
    paymentMethodId: string;
    interval: 'month' | 'week' | 'year';
    intervalCount: number;
    description: string;
    startDate?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.api.post(API_ENDPOINTS.PAYMENTS.RECURRING, recurringData);
      return {
        data: response.data.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async cancelRecurringPayment(id: string): Promise<ApiResponse<void>> {
    try {
      await this.api.delete(`${API_ENDPOINTS.PAYMENTS.RECURRING}/${id}`);
      return {
        data: undefined,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPaymentStats(): Promise<ApiResponse<{
    totalRevenue: number;
    totalTransactions: number;
    pendingPayments: number;
    failedPayments: number;
    monthlyRevenue: number;
  }>> {
    try {
      const response: AxiosResponse = await this.api.get('/api/payments/stats');
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

export const paymentService = new PaymentService();