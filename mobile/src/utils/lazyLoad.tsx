import React, { ComponentType, lazy } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { measurePerformance } from './performanceMonitor';

// Loading component
const LoadingSpinner = () => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  }}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

// Error boundary for lazy loaded components
class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || LoadingSpinner;
      return <FallbackComponent />;
    }

    return this.props.children;
  }
}

// Lazy loading wrapper with performance tracking
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  componentName: string = 'Component'
): T {
  const LazyComponent = lazy(() =>
    measurePerformance(
      `lazy-load-${componentName}`,
      async () => {
        try {
          const module = await importFunc();
          return module;
        } catch (error) {
          console.error(`Failed to lazy load ${componentName}:`, error);
          // Return a fallback component
          return {
            default: LoadingSpinner as any
          };
        }
      }
    )
  );

  // Wrap with error boundary
  const WrappedComponent = (props: any) => (
    <LazyLoadErrorBoundary>
      <React.Suspense fallback={<LoadingSpinner />}>
        <LazyComponent {...props} />
      </React.Suspense>
    </LazyLoadErrorBoundary>
  );

  return WrappedComponent as T;
}

// Preload function for critical components
export function preloadComponent(importFunc: () => Promise<any>) {
  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback);
    } else {
      setTimeout(callback, 100);
    }
  };

  schedulePreload(() => {
    importFunc().catch(error => {
      console.warn('Preload failed:', error);
    });
  });
}

// Bundle splitting utilities
export const createLazyScreen = (
  importFunc: () => Promise<{ default: ComponentType<any> }>,
  screenName: string
) => lazyLoad(importFunc, `screen-${screenName}`);

export const createLazyComponent = (
  importFunc: () => Promise<{ default: ComponentType<any> }>,
  componentName: string
) => lazyLoad(importFunc, `component-${componentName}`);

// Performance-optimized lazy loading with intersection observer
export function useLazyLoadWithIntersection(
  importFunc: () => Promise<{ default: ComponentType<any> }>,
  componentName: string,
  options: IntersectionObserverInit = {}
) {
  const [Component, setComponent] = React.useState<ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadComponent = React.useCallback(async () => {
    if (Component || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const module = await measurePerformance(
        `intersection-lazy-load-${componentName}`,
        importFunc
      );
      setComponent(() => module.default);
    } catch (err) {
      console.error(`Failed to load ${componentName}:`, err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [Component, isLoading, importFunc, componentName]);

  const ref = React.useRef<any>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadComponent();
            observer.unobserve(element);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [loadComponent, options]);

  return {
    Component,
    isLoading,
    error,
    ref,
    loadComponent
  };
}

// Code splitting by route/feature
export const routeBasedLazyLoad = {
  // Dashboard screens
  Dashboard: () => import('../screens/main/DashboardScreen'),
  Maintenance: () => import('../screens/main/MaintenanceScreen'),
  Payments: () => import('../screens/main/PaymentsScreen'),
  Properties: () => import('../screens/main/PropertiesScreen'),
  Profile: () => import('../screens/main/ProfileScreen'),

  // Auth screens
  Login: () => import('../screens/auth/LoginScreen'),
  Register: () => import('../screens/auth/RegisterScreen'),
  ForgotPassword: () => import('../screens/auth/ForgotPasswordScreen'),

  // Modal screens
  PropertyDetails: () => import('../screens/modals/PropertyDetailsModal'),
  PaymentConfirmation: () => import('../screens/modals/PaymentConfirmationModal'),
};

// Feature-based code splitting
export const featureBasedLazyLoad = {
  // Analytics features
  Charts: () => import('../components/charts'),
  Analytics: () => import('../components/analytics'),

  // Camera features
  Camera: () => import('../components/camera'),
  ImageProcessing: () => import('../services/imageProcessing'),

  // Offline features
  OfflineManager: () => import('../services/offlineManager'),
  SyncService: () => import('../services/syncService'),

  // Advanced features
  MLModels: () => import('../services/machineLearning'),
  RealTimeUpdates: () => import('../services/realTimeUpdates'),
};

// Utility for creating lazy-loaded route components
export function createLazyRoute(
  importFunc: () => Promise<{ default: ComponentType<any> }>,
  routeName: string
) {
  const LazyComponent = createLazyScreen(importFunc, routeName);

  return React.forwardRef((props: any, ref: any) => (
    <View ref={ref} style={{ flex: 1 }}>
      <LazyComponent {...props} />
    </View>
  ));
}

// Bundle size monitoring
export const bundleSizeMonitor = {
  trackBundleSize: (componentName: string, size: number) => {
    console.log(`📦 Bundle size for ${componentName}: ${(size / 1024).toFixed(2)} KB`);

    // Warn if bundle is too large
    if (size > 500 * 1024) { // 500KB
      console.warn(`⚠️ Large bundle detected for ${componentName}. Consider code splitting.`);
    }
  },

  trackLoadTime: (componentName: string, loadTime: number) => {
    console.log(`⏱️ Load time for ${componentName}: ${loadTime.toFixed(2)}ms`);

    // Warn if load time is slow
    if (loadTime > 1000) { // 1 second
      console.warn(`⚠️ Slow load time for ${componentName}. Consider optimization.`);
    }
  }
};

export default {
  lazyLoad,
  preloadComponent,
  createLazyScreen,
  createLazyComponent,
  useLazyLoadWithIntersection,
  routeBasedLazyLoad,
  featureBasedLazyLoad,
  createLazyRoute,
  bundleSizeMonitor
};
