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

  // ---------------------------------------------------------------------------
  // Fields that exist on the backend Prisma model but were missing from this
  // client type. Verified against backend/prisma/schema.prisma -> `model Rental`.
  // Optional where the column is nullable.
  // ---------------------------------------------------------------------------
  latitude?: number | null;
  longitude?: number | null;
  yearBuilt?: number | null;
  totalUnits?: number;
  /** Json column. PropertyDetailScreen tolerates both an array and a keyed object. */
  amenities?: string[] | Record<string, unknown> | null;
  deposit?: number | null;
  leaseTerms?: string | null;
  slug?: string;
  viewCount?: number;
  whiteLabelConfigId?: string | null;

  /** Serialised only when the API includes the RentalImages relation. */
  images?: RentalImage[];
  /**
   * Legacy Mongo listing shape (backend/src/models/mongoModels.ts), used by
   * PublicListingScreen, which reads `photos[0]` directly as an image URI.
   * Not part of the Prisma Rental row.
   */
  photos?: string[];

  /**
   * NOT persisted by the backend — `model Rental` has no `rentalType` column.
   * PropertyFormScreen's values are LONG_TERM / SHORT_TERM / VACATION, which is a
   * lease-term classification and most likely belongs in `leaseTerms`.
   * Left optional so the form type-checks; flagged as an open product decision.
   */
  rentalType?: string;
}

/** Mirrors backend/prisma/schema.prisma -> `model RentalImage`. */
export interface RentalImage {
  id: number;
  rentalId?: string;
  filename?: string;
  originalFilename?: string;
  mimetype?: string;
  size?: number;
  url: string;
  cdnUrl?: string | null;
  isFeatured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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

  // Real Prisma columns on `model Rental` — safe to send, and persisted.
  amenities?: string[] | Record<string, unknown> | null;
  yearBuilt?: number | null;
  totalUnits?: number;
  leaseTerms?: string | null;
  deposit?: number | null;

  /**
   * ⚠️ NOT ACCEPTED BY THE BACKEND. `backend/src/services/rentalService.ts:131` spreads
   * this DTO directly into `prisma.rental.create({ data: formattedData })`, so any key
   * that is not a Prisma column makes the write throw. `rentalType` is not a column, and
   * `images` is a relation that must be written as `RentalImages: { create: [...] }`.
   * PropertyFormScreen currently sends both — see the triage report (live defect).
   */
  rentalType?: string;
  images?: { url: string; filename?: string; isFeatured?: boolean }[];
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