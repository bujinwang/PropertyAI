/**
 * Environment Configuration for AI Dashboard Components
 * Provides environment-specific settings for development, staging, and production
 */

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  environment: Environment;
  version: string;
  buildDate: string;
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  ai: {
    enabled: boolean;
    performanceMonitoring: boolean;
    cacheEnabled: boolean;
    cacheTTL: number;
    maxRetries: number;
    timeout: number;
  };
  features: {
    errorReporting: boolean;
    analytics: boolean;
    debugMode: boolean;
    performanceOverlay: boolean;
    lazyLoading: boolean;
  };
  monitoring: {
    enabled: boolean;
    sentry: {
      dsn?: string;
      environment: string;
      tracesSampleRate: number;
    };
    analytics: {
      googleAnalyticsId?: string;
      enabled: boolean;
    };
  };
  performance: {
    bundleAnalysis: boolean;
    memoryMonitoring: boolean;
    renderTimeThreshold: number;
    memoryThreshold: number;
  };
}

// Get environment from build-time or runtime
const getEnvironment = (): Environment => {
  if (typeof window !== 'undefined') {
    // Runtime detection
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    }
    if (hostname.includes('staging') || hostname.includes('dev')) {
      return 'staging';
    }
    return 'production';
  }
  
  // Build-time detection
  return (process.env.NODE_ENV as Environment) || 'development';
};

const environment = getEnvironment();

// Base configuration
const baseConfig: Omit<EnvironmentConfig, 'environment'> = {
  version: process.env.REACT_APP_VERSION || '1.0.0',
  buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    timeout: 30000,
    retries: 3,
  },
  ai: {
    enabled: true,
    performanceMonitoring: true,
    cacheEnabled: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
    timeout: 15000,
  },
  features: {
    errorReporting: true,
    analytics: true,
    debugMode: false,
    performanceOverlay: false,
    lazyLoading: true,
  },
  monitoring: {
    enabled: true,
    sentry: {
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment,
      tracesSampleRate: 0.1,
    },
    analytics: {
      googleAnalyticsId: process.env.REACT_APP_GA_ID,
      enabled: true,
    },
  },
  performance: {
    bundleAnalysis: false,
    memoryMonitoring: false,
    renderTimeThreshold: 16, // 60fps
    memoryThreshold: 50, // MB
  },
};

// Environment-specific configurations
const environmentConfigs: Record<Environment, Partial<EnvironmentConfig>> = {
  development: {
    api: {
      ...baseConfig.api,
      baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    },
    ai: {
      ...baseConfig.ai,
      performanceMonitoring: true,
      cacheEnabled: false, // Disable cache in development for fresh data
    },
    features: {
      ...baseConfig.features,
      debugMode: true,
      performanceOverlay: true,
      errorReporting: false, // Don't report dev errors
    },
    monitoring: {
      ...baseConfig.monitoring,
      enabled: false, // Disable monitoring in development
      sentry: {
        ...baseConfig.monitoring.sentry,
        tracesSampleRate: 1.0, // Full tracing in development
      },
      analytics: {
        ...baseConfig.monitoring.analytics,
        enabled: false, // Disable analytics in development
      },
    },
    performance: {
      ...baseConfig.performance,
      bundleAnalysis: true,
      memoryMonitoring: true,
    },
  },
  staging: {
    api: {
      ...baseConfig.api,
      baseUrl: process.env.REACT_APP_API_URL || 'https://api-staging.propertyflow.ai',
    },
    ai: {
      ...baseConfig.ai,
      performanceMonitoring: true,
    },
    features: {
      ...baseConfig.features,
      debugMode: true,
      performanceOverlay: false,
    },
    monitoring: {
      ...baseConfig.monitoring,
      enabled: true,
      sentry: {
        ...baseConfig.monitoring.sentry,
        tracesSampleRate: 0.5, // Higher tracing in staging
      },
      analytics: {
        ...baseConfig.monitoring.analytics,
        enabled: false, // Disable analytics in staging
      },
    },
    performance: {
      ...baseConfig.performance,
      bundleAnalysis: true,
      memoryMonitoring: true,
    },
  },
  production: {
    api: {
      ...baseConfig.api,
      baseUrl: process.env.REACT_APP_API_URL || 'https://api.propertyflow.ai',
    },
    ai: {
      ...baseConfig.ai,
      performanceMonitoring: false, // Disable in production for performance
    },
    features: {
      ...baseConfig.features,
      debugMode: false,
      performanceOverlay: false,
    },
    monitoring: {
      ...baseConfig.monitoring,
      enabled: true,
      sentry: {
        ...baseConfig.monitoring.sentry,
        tracesSampleRate: 0.1, // Lower tracing in production
      },
      analytics: {
        ...baseConfig.monitoring.analytics,
        enabled: true,
      },
    },
    performance: {
      ...baseConfig.performance,
      bundleAnalysis: false,
      memoryMonitoring: false,
    },
  },
};

// Merge base config with environment-specific config
export const config: EnvironmentConfig = {
  ...baseConfig,
  environment,
  ...environmentConfigs[environment],
};

// Utility functions
export const isDevelopment = () => config.environment === 'development';
export const isStaging = () => config.environment === 'staging';
export const isProduction = () => config.environment === 'production';

export const debugLog = (...args: any[]) => {
  if (config.features.debugMode) {
    console.log('[AI Debug]', ...args);
  }
};

export const performanceLog = (message: string, data?: any) => {
  if (config.ai.performanceMonitoring) {
    console.log(`[AI Performance] ${message}`, data);
  }
};

// Feature flags
export const featureFlags = {
  aiCommunicationTraining: true,
  aiRiskAssessment: true,
  emergencyResponse: true,
  aiPersonalization: true,
  documentVerification: true,
  buildingHealthMonitor: true,
  aiInsights: true,
  marketIntelligence: true,
  performanceMonitoring: config.ai.performanceMonitoring,
  errorBoundary: true,
  lazyLoading: config.features.lazyLoading,
};

// Export configuration for use in components
export default config;