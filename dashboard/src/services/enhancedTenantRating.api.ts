import { apiService } from './apiService';
import {
  EnhancedTenantRating,
  CreateEnhancedRatingRequest,
  UpdateEnhancedRatingRequest,
  TenantSearchResponse,
  RatingAnalyticsResponse
} from '../types/enhancedTenantRating';

// Tenant search endpoint
export const searchTenants = async (query: string): Promise<TenantSearchResponse> => {
  const response = await apiService.get<TenantSearchResponse>('/tenants/search', { q: query });
  return response.data;
};

// Enhanced tenant ratings endpoints
export const getEnhancedTenantRatings = async (tenantId: string): Promise<EnhancedTenantRating[]> => {
  const response = await apiService.get<EnhancedTenantRating[]>(`/tenant-ratings/${tenantId}`);
  return response.data;
};

export const createEnhancedTenantRating = async (
  ratingData: CreateEnhancedRatingRequest
): Promise<EnhancedTenantRating> => {
  const response = await apiService.post<EnhancedTenantRating>('/tenant-ratings', ratingData);
  return response.data;
};

export const updateEnhancedTenantRating = async (
  id: string,
  ratingData: UpdateEnhancedRatingRequest
): Promise<EnhancedTenantRating> => {
  const response = await apiService.put<EnhancedTenantRating>(`/tenant-ratings/${id}`, ratingData);
  return response.data;
};

export const deleteEnhancedTenantRating = async (id: string): Promise<void> => {
  await apiService.delete(`/tenant-ratings/${id}`);
};

// Rating analytics endpoint
export const getTenantRatingAnalytics = async (tenantId: string): Promise<RatingAnalyticsResponse> => {
  const response = await apiService.get<RatingAnalyticsResponse>(`/tenant-ratings/${tenantId}/analytics`);
  return response.data;
};

// Utility function to calculate overall rating from categories
export const calculateOverallRating = (categories: {
  cleanliness: number;
  communication: number;
  paymentHistory: number;
  propertyCare: number;
}): number => {
  const values = Object.values(categories);
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 10) / 10; // Round to 1 decimal place
};