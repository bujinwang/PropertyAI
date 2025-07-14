export const API_URL = 'http://localhost:3001/api';

// Timeout for API requests in milliseconds
export const API_TIMEOUT = 15000;

// API endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    GOOGLE: '/auth/google',
    OAUTH_CALLBACK: '/auth/google/callback',
  },
  
  // MFA
  MFA: {
    VERIFY: '/mfa/verify',
    SETUP: '/mfa/setup',
    ENABLE: '/mfa/enable',
    DISABLE: '/mfa/disable',
    STATUS: '/mfa/status',
  },
  
  // Properties
  PROPERTIES: {
    LIST: '/properties',
    DETAIL: (id: string) => `/properties/${id}`,
    CREATE: '/properties',
    UPDATE: (id: string) => `/properties/${id}`,
    DELETE: (id: string) => `/properties/${id}`,
    IMAGES: (id: string) => `/properties/${id}/images`,
  },
  
  // Units
  UNITS: {
    LIST: '/units',
    DETAIL: (id: string) => `/units/${id}`,
    CREATE: '/units',
    UPDATE: (id: string) => `/units/${id}`,
    DELETE: (id: string) => `/units/${id}`,
    IMAGES: (id: string) => `/units/${id}/images`,
  },
  
  // Search
  SEARCH: {
    PROPERTIES: '/search/properties',
    UNITS: '/search/units',
  },
  
  // Images
  IMAGES: {
    UPLOAD: '/upload',
    PROPERTY: (id: string) => `/properties/${id}/images`,
    UNIT: (id: string) => `/units/${id}/images`,
  },
};