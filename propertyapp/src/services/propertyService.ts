import { api } from './api';
import { Property } from '../types/property';
import { PropertyType } from '../types/property'; // Import PropertyType as it's used in the interfaces below

interface CreatePropertyRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  description?: string;
  propertyType: PropertyType;
  yearBuilt?: number;
  totalUnits: number;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
}

interface UpdatePropertyRequest {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  description?: string;
  propertyType?: PropertyType;
  yearBuilt?: number;
  totalUnits?: number;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
}

const getProperties = async (publicAccess = false): Promise<Property[]> => {
  const endpoint = publicAccess ? '/properties?public=true' : '/properties';
  const response = await api.get<Property[]>(endpoint);
  return response;
};

const getPropertyById = async (id: string): Promise<Property> => {
  const response = await api.get<Property>(`/properties/${id}`);
  return response;
};

const createProperty = async (propertyData: CreatePropertyRequest): Promise<Property> => {
  const response = await api.post<Property>('/properties', propertyData);
  return response;
};

const updateProperty = async (id: string, propertyData: UpdatePropertyRequest): Promise<Property> => {
  const response = await api.put<Property>(`/properties/${id}`, propertyData);
  return response;
};

const deleteProperty = async (id: string): Promise<void> => {
  await api.delete(`/properties/${id}`);
};

const getPropertyUnits = async (propertyId: string) => {
  const response = await api.get(`/properties/${propertyId}/units`);
  return response;
};

const getPublicProperties = async (filters: {
  city?: string;
  state?: string;
  propertyType?: string;
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
  const endpoint = `/properties/public/listings${queryString ? `?${queryString}` : ''}`;
  const response = await api.get<Property[]>(endpoint);
  return response;
};

export const propertyService = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyUnits,
  getPublicProperties,
};
