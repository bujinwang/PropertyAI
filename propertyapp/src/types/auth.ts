/**
 * Represents the different user roles in the application
 */
export type UserRole = 'admin' | 'propertyManager' | 'tenant';

/**
 * User object returned from the API
 */
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  phone?: string;
  mfaEnabled?: boolean;
  lastLogin?: string;
  [key: string]: unknown;
}

/**
 * Authentication token structure
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  /**
   * OAuth2 token type. Written by authService's three token literals, but not read
   * anywhere today — kept optional rather than removed so the persisted shape is
   * unchanged.
   */
  tokenType?: string;
}

/**
 * Supported third-party OAuth providers.
 * Mirrors the providers actually offered by LoginScreen (google, facebook).
 * NOTE: the backend exposes no OAuth route, so these flows are not yet servable.
 */
export type OAuthProvider = 'google' | 'facebook';

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
/**
 * Registration payload. Mirrors the fields the backend reads in
 * `backend/src/controllers/authController.ts:14`
 * (`{ email, password, firstName, lastName, role }`) — the previous
 * `name` / `acceptTerms` shape did not match the API.
 */
export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /**
   * Optional. The backend falls through to the Prisma column default (TENANT)
   * when this is omitted, and rejects an explicit value outside
   * `PUBLIC_SIGNUP_ROLES` — see backend/src/controllers/authController.ts:20-33.
   */
  role?: UserRole;
}

/**
 * Reset password data
 */
export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

/**
 * MFA Verification response
 */
export interface MFAVerificationResponse {
  token: string;
  user: User;
  requireMFA?: boolean;
} 