export interface Listing {
  id: string;
  slug: string;
  title: string;
  description: string;
  rent: number;
  availableDate: string;
  leaseTerms?: string;
  isActive: boolean;
  status: ListingStatus;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  propertyId: string;
  unitId?: string;
  createdById: string;
  // Related data that might be included in API responses
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    propertyType: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet?: number;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  images?: ListingImage[];
}

export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED'
}

export interface ListingImage {
  id: number;
  listingId: string;
  url: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  rent: number;
  availableDate: string;
  leaseTerms?: string;
  propertyId: string;
  unitId?: string;
  status?: ListingStatus;
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  rent?: number;
  availableDate?: string;
  leaseTerms?: string;
  status?: ListingStatus;
}