export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://localhost:3001/api'
    : 'https://api.propertyai.com/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    MFA: {
      ENABLE: '/mfa/enable',
      VERIFY: '/mfa/verify',
      DISABLE: '/mfa/disable',
    },
    OAUTH: {
      GOOGLE: '/auth/google/token',
      FACEBOOK: '/auth/facebook/token',
    },
  },

  // Properties
  PROPERTIES: '/rentals',
  PROPERTY_DETAILS: (id: string) => `/rentals/${id}`,

  // Maintenance
  MAINTENANCE: {
    REQUESTS: '/maintenance',
    REQUEST_DETAILS: (id: string) => `/maintenance/${id}`,
    CREATE: '/maintenance',
    UPDATE_STATUS: (id: string) => `/maintenance/${id}/status`,
    UPLOAD_PHOTOS: (id: string) => `/maintenance/${id}/photos`,
  },

  // Payments
  PAYMENTS: {
    PROCESS: '/payments/process',
    METHODS: '/payments/payment-methods',
    TRANSACTIONS: '/payments/transactions',
    RECURRING: '/payments/recurring',
    WEBHOOKS: '/payments/webhooks',
  },

  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
  },

  // Dashboard
  DASHBOARD: {
    METRICS: '/dashboard/metrics',
    ANALYTICS: '/dashboard/analytics',
  },

  // AI Insights
  AI: {
    INSIGHTS: '/ai/insights',
    PREDICTIVE: '/ai/predictive-maintenance',
  },
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  OFFLINE: 'You are currently offline. Changes will be synced when connection is restored.',
};