export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  moveInDate?: string;
  moveOutDate?: string;
  monthlyRent?: number;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  reasonForLeaving?: string;
}

export interface Employment {
  employer: string;
  position: string;
  startDate: string;
  endDate?: string;
  monthlyIncome: number;
  supervisorName: string;
  supervisorPhone: string;
  supervisorEmail?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
  verified: boolean;
}

export interface ApplicantPersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn: string;
  driversLicense?: string;
  driversLicenseState?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Application {
  id: string;
  propertyId: string;
  unitId: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'more_info_needed';
  submissionDate?: string;
  lastUpdated: string;
  personalInfo: ApplicantPersonalInfo;
  currentAddress: Address;
  previousAddresses: Address[];
  employmentHistory: Employment[];
  otherIncome?: {
    source: string;
    monthlyAmount: number;
  }[];
  emergencyContacts: EmergencyContact[];
  documents: Document[];
  backgroundCheckConsent: boolean;
  creditCheckConsent: boolean;
  evictionCheckConsent: boolean;
  additionalNotes?: string;
  riskScore?: number;
  screeningResults?: {
    creditScore?: number;
    criminalRecords?: boolean;
    evictionHistory?: boolean;
    incomeToRentRatio?: number;
    recommendations?: string;
  };
  reviewNotes?: string;
  rejectionReason?: string;
  additionalInfoRequested?: string[];
  // New fields for rental integration
  rentalId?: string; // Link to the new rental model
}

/**
 * @deprecated Use Rental interface instead
 * Legacy Property interface - use Rental for new development
 */
export interface Property {
  id: string;
  name: string;
  address: Address;
  units: Unit[];
}

/**
 * @deprecated Use Rental interface instead
 * Legacy Unit interface - use Rental with unitNumber for new development
 */
export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  monthlyRent: number;
  available: boolean;
  availableDate?: string;
  // New fields for rental integration
  rentalId?: string; // Link to the new rental model
}

// Migration helpers
import { Rental } from '../../../propertyapp/src/types/rental';

export const mapRentalToScreeningProperty = (rental: Rental): Property => {
  console.warn('mapRentalToScreeningProperty is a migration helper. Consider updating to use Rental directly.');
  
  return {
    id: rental.legacyPropertyId || rental.id,
    name: rental.title,
    address: {
      street: rental.address,
      city: rental.city,
      state: rental.state,
      zipCode: rental.zipCode,
      country: rental.country || 'USA'
    },
    units: rental.unitNumber ? [{
      id: rental.legacyUnitId || rental.id,
      propertyId: rental.legacyPropertyId || rental.id,
      unitNumber: rental.unitNumber,
      bedrooms: rental.bedrooms || 0,
      bathrooms: rental.bathrooms || 0,
      squareFeet: rental.size || 0,
      monthlyRent: rental.rent,
      available: rental.isAvailable,
      availableDate: rental.availableDate?.toISOString(),
      rentalId: rental.id
    }] : []
  };
};

export const mapRentalToScreeningUnit = (rental: Rental): Unit | null => {
  console.warn('mapRentalToScreeningUnit is a migration helper. Consider updating to use Rental directly.');
  
  if (!rental.unitNumber) {
    return null;
  }
  
  return {
    id: rental.legacyUnitId || rental.id,
    propertyId: rental.legacyPropertyId || rental.id,
    unitNumber: rental.unitNumber,
    bedrooms: rental.bedrooms || 0,
    bathrooms: rental.bathrooms || 0,
    squareFeet: rental.size || 0,
    monthlyRent: rental.rent,
    available: rental.isAvailable,
    availableDate: rental.availableDate?.toISOString(),
    rentalId: rental.id
  };
};