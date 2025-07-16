import { api } from './api';
import { Unit, CreateUnitRequest, UpdateUnitRequest } from '../types/unit';

const getUnits = async (): Promise<Unit[]> => {
  const response = await api.get<Unit[]>('/units');
  return response;
};

const getUnitById = async (id: string): Promise<Unit> => {
  const response = await api.get<Unit>(`/units/${id}`);
  return response;
};

const getPropertyUnits = async (propertyId: string): Promise<Unit[]> => {
  const response = await api.get<Unit[]>(`/properties/${propertyId}/units`);
  return response;
};

const createUnit = async (unitData: CreateUnitRequest): Promise<Unit> => {
  const response = await api.post<Unit>('/units', unitData);
  return response;
};

const updateUnit = async (id: string, unitData: UpdateUnitRequest): Promise<Unit> => {
  const response = await api.put<Unit>(`/units/${id}`, unitData);
  return response;
};

const deleteUnit = async (id: string): Promise<void> => {
  await api.delete(`/units/${id}`);
};

const getUnitListings = async (unitId: string) => {
  const response = await api.get(`/units/${unitId}/listings`);
  return response;
};

const createUnitListing = async (unitId: string, listingData: any) => {
  const response = await api.post(`/units/${unitId}/listings`, listingData);
  return response;
};

export const unitService = {
  getUnits,
  getUnitById,
  getPropertyUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitListings,
  createUnitListing,
};