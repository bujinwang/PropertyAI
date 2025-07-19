/**
 * Environment Configuration
 * Centralized configuration management for different deployment environments
 */

export interface EnvironmentConfig {
  apiBaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  buildDate: string;
  analytics: {
    enabled: boolean;
    analyticsId?: string;
  };
  monitoring: {
    enabled: boolean;
    sentryDsn?: string;
    performanceMonitoring: boolean;
  };
  features: {
    aiEnabled: boolean;
    debugMode: boolean;
    errorReporting: boolean;
  };
  security: {
    cspEnabled: boolean;
    httpsOnly: boolean;
  };
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  return {
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
    environment: (process.env.REACT_APP_ENVIRONMENT as any) || 'development',
    version: process.env.REACT_APP_VERSION || '0.1.0',
    buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
    analytics: {
      enabled: !!process.env.REACT_APP_ANALYTICS_ID,
      analyticsId: process.env.REACT_APP_ANALYTICS_ID,
    },
    monitoring: {
      enabled: !!process.env.REACT_APP_SENTRY_DSN,
      sentryDsn: process.env.REACT_APP_SENTRY_DSN,
      performanceMonitoring: process.env.REACT_APP_PERFORMANCE_MONITORING === 'true',
    },
    features: {
      aiEnabled: process.env.REACT_APP_AI_FEATURES_ENABLED !== 'false',
      debugMode: process.env.REACT_APP_DEBUG_MODE === 'true',
      errorReporting: process.env.REACT_APP_ERROR_REPORTING === 'true',
    },
    security: {
      cspEnabled: process.env.REACT_APP_CSP_ENABLED === 'true',
      httpsOnly: process.env.REACT_APP_HTTPS_ONLY === 'true',
    },
  };
};

export const config = getEnvironmentConfig();

// Environment helpers
export const isDevelopment = config.environment === 'development';
export const isStaging = config.environment === 'staging';
export const isProduction = config.environment === 'production';

// Feature flags
export const isFeatureEnabled = (feature: keyof typeof config.features): boolean => {
  return config.features[feature];
};

// Debug logging helper
export const debugLog = (...args: any[]): void => {
  if (config.features.debugMode) {
    console.log('[DEBUG]', ...args);
  }
};

export default config;