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
}

export interface Property {
  id: string;
  name: string;
  address: Address;
  units: Unit[];
}

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
} 