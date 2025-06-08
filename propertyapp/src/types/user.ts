export enum UserRole {
  ADMIN = 'ADMIN',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  TENANT = 'TENANT'
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