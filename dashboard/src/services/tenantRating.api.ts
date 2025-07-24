import axios from 'axios';
import { TenantRating } from '../types/tenantRating';

const API_URL = 'http://localhost:5001/api/tenant-ratings';

export const getTenantRatings = async (tenantId: string): Promise<TenantRating[]> => {
  const response = await axios.get(`${API_URL}/${tenantId}`);
  return response.data;
};

export const createTenantRating = async (ratingData: {
  leaseId: string;
  tenantId: string;
  raterId: string;
  rating: number;
  comment?: string;
}): Promise<TenantRating> => {
  const response = await axios.post(API_URL, ratingData);
  return response.data;
};
