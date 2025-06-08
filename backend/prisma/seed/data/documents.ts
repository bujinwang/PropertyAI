import { DocumentType } from '@prisma/client';

interface DocumentSeed {
  id?: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadedAt?: Date | string;
  updatedAt?: Date | string;
  description?: string;
  propertyId?: string;
  leaseId?: string;
  uploadedById: string;
  maintenanceRequestId?: string;
  size?: number;
  mimeType?: string;
  isArchived?: boolean;
}

// Entity IDs
const ADMIN_ID = '1';
const MANAGER1_ID = '2';
const MANAGER2_ID = '3';
const SUNRISE_APARTMENTS_ID = '1';
const PARKVIEW_TOWNHOMES_ID = '2';
const OAKRIDGE_HOUSE_ID = '3';
const LEASE1_ID = '1';
const LEASE2_ID = '2';

export const documents: DocumentSeed[] = [
  // Property photos
  {
    name: 'Sunrise Apartments - Exterior',
    type: DocumentType.PROPERTY_PHOTO,
    url: 'https://propertyai-storage.s3.amazonaws.com/properties/sunrise-apartments-exterior.jpg',
    description: 'Exterior view of Sunrise Apartments building',
    propertyId: SUNRISE_APARTMENTS_ID,
    uploadedById: MANAGER1_ID,
    size: 2500000,
    mimeType: 'image/jpeg',
  },
  {
    name: 'Parkview Townhomes - Exterior',
    type: DocumentType.PROPERTY_PHOTO,
    url: 'https://propertyai-storage.s3.amazonaws.com/properties/parkview-townhomes-exterior.jpg',
    description: 'Exterior view of Parkview Townhomes',
    propertyId: PARKVIEW_TOWNHOMES_ID,
    uploadedById: MANAGER1_ID,
    size: 3100000,
    mimeType: 'image/jpeg',
  },
  
  // Lease documents
  {
    name: 'Lease Agreement - Unit 101',
    type: DocumentType.LEASE,
    url: 'https://propertyai-storage.s3.amazonaws.com/leases/lease-unit-101.pdf',
    description: 'Signed lease agreement for Unit 101',
    leaseId: LEASE1_ID,
    uploadedById: MANAGER1_ID,
    size: 1250000,
    mimeType: 'application/pdf',
  },
  {
    name: 'Lease Agreement - Unit 102',
    type: DocumentType.LEASE,
    url: 'https://propertyai-storage.s3.amazonaws.com/leases/lease-unit-102.pdf',
    description: 'Signed lease agreement for Unit 102',
    leaseId: LEASE2_ID,
    uploadedById: MANAGER1_ID,
    size: 1280000,
    mimeType: 'application/pdf',
  },
  
  // Property documents
  {
    name: 'Sunrise Apartments - Floor Plans',
    type: DocumentType.PROPERTY_PHOTO,
    url: 'https://propertyai-storage.s3.amazonaws.com/properties/sunrise-apartments-floor-plans.pdf',
    description: 'Floor plans for all units in Sunrise Apartments',
    propertyId: SUNRISE_APARTMENTS_ID,
    uploadedById: MANAGER1_ID,
    size: 4500000,
    mimeType: 'application/pdf',
  },
  {
    name: 'Parkview Townhomes - Community Guidelines',
    type: DocumentType.OTHER,
    url: 'https://propertyai-storage.s3.amazonaws.com/properties/parkview-guidelines.pdf',
    description: 'Community guidelines and rules for Parkview Townhomes',
    propertyId: PARKVIEW_TOWNHOMES_ID,
    uploadedById: MANAGER1_ID,
    size: 980000,
    mimeType: 'application/pdf',
  },
  
  // Insurance documents
  {
    name: 'Sunrise Apartments - Insurance Policy',
    type: DocumentType.OTHER,
    url: 'https://propertyai-storage.s3.amazonaws.com/properties/sunrise-insurance.pdf',
    description: 'Property insurance policy for Sunrise Apartments',
    propertyId: SUNRISE_APARTMENTS_ID,
    uploadedById: ADMIN_ID,
    size: 3200000,
    mimeType: 'application/pdf',
  },
  
  // Inspection report
  {
    name: 'Oakridge House - Inspection Report',
    type: DocumentType.OTHER,
    url: 'https://propertyai-storage.s3.amazonaws.com/properties/oakridge-inspection.pdf',
    description: 'Annual property inspection report for Oakridge House',
    propertyId: OAKRIDGE_HOUSE_ID,
    uploadedById: MANAGER2_ID,
    size: 2800000,
    mimeType: 'application/pdf',
  },
]; 