export interface Property {
  id: string;
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
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  managerId: string;
  ownerId: string;
  latitude?: number;
  longitude?: number;
  units?: Unit[];
  images?: PropertyImage[];
}

export interface PropertyImage {
  id: number;
  propertyId: string;
  filename: string;
  originalFilename: string;
  mimetype: string;
  size: number;
  url: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  CONDO = 'CONDO',
  TOWNHOUSE = 'TOWNHOUSE',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  OTHER = 'OTHER'
}

export interface CreatePropertyRequest {
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

export interface UpdatePropertyRequest {
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