// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  isMfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'TENANT' | 'PROPERTY_MANAGER' | 'ADMIN';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

// Property Types
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type: PropertyType;
  status: PropertyStatus;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRent: number;
  images: string[];
  amenities: string[];
  description?: string;
  managerId: string;
  createdAt: string;
  updatedAt: string;
}

export type PropertyType = 'APARTMENT' | 'HOUSE' | 'CONDO' | 'TOWNHOUSE' | 'COMMERCIAL';
export type PropertyStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'SOLD';

// Unit Types
export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor?: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  monthlyRent: number;
  status: UnitStatus;
  isAvailable: boolean;
  availableDate?: string;
  images: string[];
  amenities: string[];
  description?: string;
}

export type UnitStatus = 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';

// Maintenance Types
export interface MaintenanceRequest {
  id: string;
  unitId: string;
  tenantId: string;
  propertyId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  images: string[];
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  completedDate?: string;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
}

export type MaintenanceCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'HVAC'
  | 'APPLIANCES'
  | 'STRUCTURAL'
  | 'PAINTING'
  | 'CLEANING'
  | 'OTHER';

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type MaintenanceStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Payment Types
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  billingAddress?: Address;
}

export type PaymentMethodType = 'CARD' | 'BANK_ACCOUNT';

export interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  paymentMethodId: string;
  createdAt: string;
  processedAt?: string;
  metadata?: Record<string, any>;
}

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

// Common Types
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Form Types
export interface FormField {
  value: any;
  error?: string;
  touched?: boolean;
}

export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PropertyDetails: { propertyId: string };
  UnitDetails: { unitId: string };
  MaintenanceDetails: { requestId: string };
  PaymentDetails: { transactionId: string };
  Profile: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MFASetup: undefined;
  MFAVerify: { token: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Properties: undefined;
  Maintenance: undefined;
  Payments: undefined;
  Profile: undefined;
};