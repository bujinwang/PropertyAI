export interface Unit {
  id: string;
  unitNumber: string;
  floorNumber?: number;
  size?: number; // in square feet/meters
  bedrooms?: number;
  bathrooms?: number;
  rent?: number;
  deposit?: number;
  isAvailable: boolean;
  dateAvailable?: string;
  features?: string[];
  createdAt: string;
  updatedAt: string;
  propertyId: string;
  tenantId?: string;
  images?: UnitImage[];
}

export interface UnitImage {
  id: number;
  unitId: string;
  url: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface CreateUnitRequest {
  unitNumber: string;
  floorNumber?: number;
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  rent?: number;
  deposit?: number;
  isAvailable?: boolean;
  dateAvailable?: string;
  features?: string[];
  propertyId: string;
}

export interface UpdateUnitRequest {
  unitNumber?: string;
  floorNumber?: number;
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  rent?: number;
  deposit?: number;
  isAvailable?: boolean;
  dateAvailable?: string;
  features?: string[];
}