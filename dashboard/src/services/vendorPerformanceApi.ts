import { apiService } from './apiService';
import { VendorPerformanceRating } from '../types/vendor';

export const vendorPerformanceApi = {
  createRating: (data: Omit<VendorPerformanceRating, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiService.post<VendorPerformanceRating>('/vendor-performance', data),

  getRating: (id: string) =>
    apiService.get<VendorPerformanceRating>(`/vendor-performance/${id}`),

  getRatingsForVendor: (vendorId: string) =>
    apiService.get<VendorPerformanceRating[]>(`/vendor-performance/vendor/${vendorId}`),

  getRatingsForWorkOrder: (workOrderId: string) =>
    apiService.get<VendorPerformanceRating[]>(`/vendor-performance/work-order/${workOrderId}`),

  getAverageScoreForVendor: (vendorId: string) =>
    apiService.get<{ averageScore: number }>(`/vendor-performance/vendor/${vendorId}/average-score`),
};
