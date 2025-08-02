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

export const listingService = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getPublicListings,
};