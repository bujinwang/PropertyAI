// PropertyFlow AI Navigation System - Main Export
// Central access point for all navigation components, hooks, and utilities

// Core navigation system
export { NavigationProvider, useNavigation } from './NavigationProvider';
export type { 
  NavigationItem, 
  NavigationState, 
  NavigationContextType, 
  NavigationBreakpoint 
} from './NavigationProvider';

// Navigation components
export { DesktopSidebar } from './components/DesktopSidebar';
export { TabletDrawer } from './components/TabletDrawer';
export { MobileBottomTabs } from './components/MobileBottomTabs';
export { NavigationItemComponent } from './components/NavigationItem';

// Navigation hooks and utilities
export * from './hooks/useNavigation';

// Re-export commonly used items with convenient names
export {
  useNavigationActions,
  useBreadcrumbs,
  useNavigationSearch,
  useNavigationBreakpoint,
  useNavigationShortcuts,
} from './hooks/useNavigation';

// Navigation configuration helpers
export const createNavigationItem = (config: {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: number | string;
  role?: 'admin' | 'manager' | 'user' | 'tenant';
  children?: any[];
  description?: string;
  isExternal?: boolean;
}): NavigationItem => {
  return {
    id: config.id,
    label: config.label,
    icon: config.icon,
    href: config.href,
    badge: config.badge,
    role: config.role,
    children: config.children,
    description: config.description,
    isExternal: config.isExternal || false,
  };
};

// Navigation constants
export const NAVIGATION_CONSTANTS = {
  // Breakpoint widths (matches design tokens)
  BREAKPOINTS: {
    MOBILE_MAX: 767,
    TABLET_MIN: 768,
    TABLET_MAX: 1023,
    DESKTOP_MIN: 1024,
  },
  
  // Component dimensions
  SIDEBAR: {
    WIDTH_EXPANDED: 280,
    WIDTH_COLLAPSED: 72,
  },
  
  DRAWER: {
    WIDTH: 320,
  },
  
  BOTTOM_TABS: {
    HEIGHT: 64,
    MAX_ITEMS: 5,
  },
  
  // Z-index values
  Z_INDEX: {
    SIDEBAR: 1200,
    DRAWER: 1300,
    BOTTOM_TABS: 1100,
  },
} as const;