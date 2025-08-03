export interface Rental {
  id: string;
  title: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  propertyType: PropertyType;
  rent: number;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  unitNumber?: string;
  floorNumber?: number;
  isAvailable: boolean;
  availableDate?: Date;
  status: RentalStatus;
  isActive: boolean;
  managerId: string;
  ownerId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  // Legacy compatibility fields
  legacyPropertyId?: string;
  legacyUnitId?: string;
  legacyListingId?: string;
  type?: RentalType;
  parentRentalId?: string;
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  CONDO = 'CONDO',
  TOWNHOUSE = 'TOWNHOUSE',
  STUDIO = 'STUDIO',
  OTHER = 'OTHER'
}

export enum RentalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE'
}

export enum RentalType {
  PROPERTY = 'PROPERTY',
  UNIT = 'UNIT',
  LISTING = 'LISTING'
}

export interface CreateRentalDto {
  title: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  propertyType: PropertyType;
  rent: number;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  unitNumber?: string;
  floorNumber?: number;
  isAvailable?: boolean;
  availableDate?: Date;
  status?: RentalStatus;
  isActive?: boolean;
  managerId: string;
  ownerId: string;
  createdById: string;
  type?: RentalType;
  parentRentalId?: string;
}

export interface UpdateRentalDto {
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  propertyType?: PropertyType;
  rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  unitNumber?: string;
  floorNumber?: number;
  isAvailable?: boolean;
  availableDate?: Date;
  status?: RentalStatus;
  isActive?: boolean;
}

export interface RentalFilterParams {
  title?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  propertyType?: PropertyType;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minRent?: number;
  maxRent?: number;
  minSize?: number;
  maxSize?: number;
  isAvailable?: boolean;
  status?: RentalStatus;
  managerId?: string;
  ownerId?: string;
  isActive?: boolean;
  type?: RentalType;
  parentRentalId?: string;
}