export interface Listing {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  status: ListingStatus;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  propertyId: string;
  unitId: string;
  authorId: string;
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
  author?: {
    id: string;
    name: string;
    email: string;
  };
  images?: ListingImage[];
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  RENTED = 'RENTED'
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
  price: number;
  propertyId: string;
  unitId: string;
  status?: ListingStatus;
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  price?: number;
  status?: ListingStatus;
}