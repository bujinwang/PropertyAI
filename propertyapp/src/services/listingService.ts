import { api } from './api';

export interface Listing {
  id: string;
  title: string;
  description: string;
  rent: number;
  availableDate: string;
  leaseTerms?: string;
  isActive: boolean;
  status: string;
  propertyId: string;
  unitId?: string;
  createdById: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateListingRequest {
  title: string;
  description: string;
  rent: number;
  availableDate: string;
  leaseTerms?: string;
  isActive?: boolean;
  status?: string;
  propertyId: string;
  unitId?: string;
}

interface UpdateListingRequest {
  title?: string;
  description?: string;
  rent?: number;
  availableDate?: string;
  leaseTerms?: string;
  isActive?: boolean;
  status?: string;
  propertyId?: string;
  unitId?: string;
}

const getListings = async (): Promise<Listing[]> => {
  const response = await api.get<Listing[]>('/listings');
  return response;
};

const getListingById = async (id: string): Promise<Listing> => {
  const response = await api.get<Listing>(`/listings/${id}`);
  return response;
};

const createListing = async (listingData: CreateListingRequest): Promise<Listing> => {
  const response = await api.post<Listing>('/listings', listingData);
  return response;
};

const updateListing = async (id: string, listingData: UpdateListingRequest): Promise<Listing> => {
  const response = await api.put<Listing>(`/listings/${id}`, listingData);
  return response;
};

const deleteListing = async (id: string): Promise<void> => {
  await api.delete(`/listings/${id}`);
};

const getPublicListings = async (filters: {
  search?: string;
  skip?: number;
  take?: number;
} = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });
  
  const queryString = params.toString();
  const endpoint = `/listings/public${queryString ? `?${queryString}` : ''}`;
  const response = await api.get<Listing[]>(endpoint);
  return response;
};

/**
 * @deprecated This service has been removed. Use rentalService instead.
 * All listing functionality is now handled through the unified Rental model.
 * 
 * Migration guide:
 * - listingService.getListings() → rentalService.getRentals({ isActive: true })
 * - listingService.getListingById(id) → rentalService.getRentalById(id)
 * - listingService.createListing(data) → rentalService.createRental(data)
 * - listingService.updateListing(id, data) → rentalService.updateRental(id, data)
 * - listingService.deleteListing(id) → rentalService.deleteRental(id)
 */

import { rentalService } from './rentalService';

console.error('listingService has been removed. Please use rentalService instead.');

export const listingService = {
  getListings: () => {
    throw new Error('listingService.getListings() has been removed. Use rentalService.getRentals({ isActive: true }) instead.');
  },
  getListingById: () => {
    throw new Error('listingService.getListingById() has been removed. Use rentalService.getRentalById() instead.');
  },
  createListing: () => {
    throw new Error('listingService.createListing() has been removed. Use rentalService.createRental() instead.');
  },
  updateListing: () => {
    throw new Error('listingService.updateListing() has been removed. Use rentalService.updateRental() instead.');
  },
  deleteListing: () => {
    throw new Error('listingService.deleteListing() has been removed. Use rentalService.deleteRental() instead.');
  },
};