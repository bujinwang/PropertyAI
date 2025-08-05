import axios from 'axios';
import { apiService } from './apiService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Rental {
  id: string;
  title: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  propertyType: string;
  yearBuilt?: number;
  totalUnits: number;
  amenities?: any;
  unitNumber?: string;
  floorNumber?: number;
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  rent: number;
  deposit?: number;
  availableDate?: string;
  isAvailable: boolean;
  leaseTerms?: string;
  slug: string;
  viewCount: number;
  isActive: boolean;
  status: string;
  managerId: string;
  ownerId: string;
  createdById: string;
  whiteLabelConfigId?: string;
  createdAt: string;
  updatedAt: string;
  Manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  Owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  RentalImages?: any[];
  Documents?: any[];
  MaintenanceRequests?: any[];
  Leases?: any[];
  Applications?: any[];
}

export interface CreateRentalDto {
  title: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  propertyType: string;
  yearBuilt?: number;
  totalUnits?: number;
  amenities?: Record<string, any>;
  unitNumber?: string;
  floorNumber?: number;
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  rent: number;
  deposit?: number;
  availableDate?: string;
  isAvailable?: boolean;
  leaseTerms?: string;
  slug?: string;
  isActive?: boolean;
  status?: string;
  managerId: string;
  ownerId: string;
  createdById: string;
  whiteLabelConfigId?: string;
}

export interface RentalFilterParams {
  title?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  propertyType?: string;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minRent?: number;
  maxRent?: number;
  minSize?: number;
  maxSize?: number;
  isAvailable?: boolean;
  status?: string;
  managerId?: string;
  ownerId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RentalResponse {
  status: string;
  data: Rental[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Public endpoints (no authentication required)
export const getPublicRentals = async (): Promise<RentalResponse> => {
  const response = await apiService.get(`/rentals/public`);
  return response.data;
};

export const getPublicRental = async (id: string): Promise<Rental> => {
  const response = await apiService.get(`/rentals/public/${id}`);
  return response.data.data;
};

// Protected endpoints (authentication required)
export const getRentals = async (filters?: RentalFilterParams): Promise<RentalResponse> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await apiService.get(`/rentals?${params.toString()}`);
  return response.data;
};

export const getRental = async (id: string): Promise<Rental> => {
  const response = await apiService.get(`/rentals/${id}`);
  return response.data.data;
};

export const createRental = async (rental: CreateRentalDto): Promise<Rental> => {
  const response = await apiService.post(`/rentals`, rental);
  return response.data.data;
};

export const updateRental = async (id: string, rental: Partial<CreateRentalDto>): Promise<Rental> => {
  const response = await apiService.put(`/rentals/${id}`, rental);
  return response.data.data;
};

export const deleteRental = async (id: string): Promise<void> => {
  await apiService.delete(`/rentals/${id}`);
};

export const setRentalAvailability = async (
  id: string, 
  isAvailable: boolean, 
  availableDate?: string
): Promise<Rental> => {
  const response = await apiService.put(`/rentals/${id}/availability`, {
    isAvailable,
    availableDate
  });
  return response.data.data;
};

export const setRentalStatus = async (id: string, status: string): Promise<Rental> => {
  const response = await apiService.put(`/rentals/${id}/status`, { status });
  return response.data.data;
};

export const setRentalActiveStatus = async (id: string, isActive: boolean): Promise<Rental> => {
  const response = await apiService.put(`/rentals/${id}/active`, { isActive });
  return response.data.data;
};

export const getRentalsByManager = async (managerId: string, includeInactive?: boolean): Promise<Rental[]> => {
  const params = includeInactive ? '?includeInactive=true' : '';
  const response = await apiService.get(`/rentals/manager/${managerId}${params}`);
  return response.data.data;
};

export const getRentalsByOwner = async (ownerId: string, includeInactive?: boolean): Promise<Rental[]> => {
  const params = includeInactive ? '?includeInactive=true' : '';
  const response = await apiService.get(`/rentals/owner/${ownerId}${params}`);
  return response.data.data;
};

export const getRentalStats = async (managerId?: string, ownerId?: string): Promise<any> => {
  const params = new URLSearchParams();
  if (managerId) params.append('managerId', managerId);
  if (ownerId) params.append('ownerId', ownerId);
  
  const response = await apiService.get(`/rentals/analytics/summary?${params.toString()}`);
  return response.data.data;
};