import { api } from './api';
import { Property, CreatePropertyRequest, UpdatePropertyRequest } from '../types/property';

const getProperties = async (): Promise<Property[]> => {
  const response = await api.get<Property[]>('/properties');
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

export const propertyService = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyUnits,
};