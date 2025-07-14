// Basic Types
export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Employment {
  employer: string;
  position: string;
  startDate: string;
  endDate?: string;
  currentEmployer: boolean;
  monthlyIncome: number;
  supervisorName?: string;
  supervisorPhone?: string;
}

export interface Reference {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  years: number;
}

export interface Document {
  id: string;
  type: 'id' | 'paystub' | 'tax_return' | 'bank_statement' | 'reference_letter' | 'other';
  name: string;
  url: string;
  uploadedAt: string;
  verified: boolean;
}

export interface BackgroundCheck {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  creditScore?: number;
  criminalRecord?: boolean;
  evictionHistory?: boolean;
  incomeVerified?: boolean;
  employmentVerified?: boolean;
  report?: string; // URL to full report
}

// Main Application Types
export interface Applicant {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn?: string; // Should be handled securely
  currentAddress: Address;
  previousAddresses?: Address[];
  employmentHistory: Employment[];
  references?: Reference[];
  documents?: Document[];
}

export interface Application {
  id: string;
  propertyId: string;
  propertyName?: string;
  applicantName?: string;
  applicantEmail?: string;
  status: 'pending' | 'approved' | 'rejected' | 'review' | 'incomplete';
  submittedAt: string;
  updatedAt?: string;
  moveInDate?: string;
  leaseTermMonths?: number;
  monthlyRent?: number;
  securityDeposit?: number;
  applicants?: Applicant[];
  backgroundCheck?: BackgroundCheck;
  creditScore?: number;
  notes?: string;
  rejectionReason?: string;
}

// Form Data Types (for creating/updating applications)
export interface ApplicationFormData {
  propertyId: string;
  moveInDate?: string;
  leaseTermMonths?: number;
  applicants: ApplicantFormData[];
  notes?: string;
}

export interface ApplicantFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn?: string;
  currentAddress: Address;
  previousAddresses?: Address[];
  employmentHistory: Employment[];
  references?: Reference[];
}

// Property Types (used in application context)
export interface Property {
  id: string;
  name: string;
  address: Address;
  type: 'apartment' | 'house' | 'condo' | 'townhouse' | 'other';
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  monthlyRent: number;
  securityDeposit: number;
  available: boolean;
  availableDate?: string;
  images?: string[];
  description?: string;
} 