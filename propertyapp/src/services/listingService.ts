import { api } from './api';
import { Listing, CreateListingRequest, UpdateListingRequest } from '../types/listing';

const getListings = async (): Promise<Listing[]> => {
  const response = await api.get<Listing[]>('/listings');
  return response;
};

const getListingById = async (id: string): Promise<Listing> => {
  const response = await api.get<Listing>(`/listings/${id}`);
  return response;
};

const getUnitListings = async (unitId: string): Promise<Listing[]> => {
  const response = await api.get<Listing[]>(`/units/${unitId}/listings`);
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

const publishListing = async (id: string): Promise<Listing> => {
  const response = await api.put<Listing>(`/listings/${id}/publish`);
  return response;
};

const unpublishListing = async (id: string): Promise<Listing> => {
  const response = await api.put<Listing>(`/listings/${id}/unpublish`);
  return response;
};

export const listingService = {
  getListings,
  getListingById,
  getUnitListings,
  createListing,
  updateListing,
  deleteListing,
  publishListing,
  unpublishListing,
};