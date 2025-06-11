export enum UserRole {
  ADMIN = 'ADMIN',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  TENANT = 'TENANT'
}

export interface UserSettings {
  privacy?: {
    marketingCommunications: boolean;
    dataSharing: boolean;
    locationTracking: boolean;
    analyticsCollection: boolean;
    personalization: boolean;
  };
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  aiAutomationLevel?: 'minimal' | 'balanced' | 'full';
  // Allow for future settings to be added
  [key: string]: unknown;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  mfaEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  settings?: UserSettings;
}

export interface UserProfile extends User {
  properties?: {
    owned: number;
    managed: number;
  };
  units?: {
    rented: number;
  };
} 