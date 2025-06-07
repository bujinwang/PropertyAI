/**
 * Represents the different user roles in the application
 */
export type UserRole = 'admin' | 'propertyManager' | 'tenant';

/**
 * User object returned from the API
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  [key: string]: unknown;
}

/**
 * Authentication token structure
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Auth error response from API
 */
export interface AuthError {
  message: string;
  code: string;
  status: number;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  acceptTerms: boolean;
}

/**
 * Reset password data
 */
export interface ResetPasswordData {
  token: string;
  newPassword: string;
} 