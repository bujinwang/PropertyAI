// PropertyFlow AI Navigation Provider
// Context and state management for responsive navigation system

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { tokens } from '../tokens';

export type NavigationBreakpoint = 'mobile' | 'tablet' | 'desktop';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: number | string;
  role?: 'admin' | 'manager' | 'user' | 'tenant';
  children?: NavigationItem[];
  description?: string;
  isExternal?: boolean;
}

export interface NavigationState {
  isOpen: boolean;
  activeSection: string;
  currentBreakpoint: NavigationBreakpoint;
  notifications: Record<string, number>;
  sidebarCollapsed: boolean;
  drawerOpen: boolean;
}

export interface NavigationContextType {
  // State
  state: NavigationState;
  
  // Navigation items
  items: NavigationItem[];
  
  // Actions
  toggleSidebar: () => void;
  toggleDrawer: () => void;
  closeSidebar: () => void;
  closeDrawer: () => void;
  setActiveSection: (sectionId: string) => void;
  updateNotifications: (itemId: string, count: number) => void;
  
  // Utilities
  isActive: (href: string) => boolean;
  getActiveItem: () => NavigationItem | undefined;
  canAccess: (item: NavigationItem, userRole?: string) => boolean;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  
  if (context === undefined) {
    throw new Error(
      'useNavigation must be used within a NavigationProvider. ' +
      'Make sure your app is wrapped with <NavigationProvider>.'
    );
  }
  
  return context;
};

export interface NavigationProviderProps {
  children: ReactNode;
  items: NavigationItem[];
  userRole?: string;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  children, 
  items,
  userRole = 'user'
}) => {
  const location = useLocation();
  const theme = useTheme();
  
  // Breakpoint detection
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Determine current breakpoint
  const getCurrentBreakpoint = (): NavigationBreakpoint => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  };

  // Navigation state
  const [state, setState] = useState<NavigationState>({
    isOpen: false,
    activeSection: '',
    currentBreakpoint: getCurrentBreakpoint(),
    notifications: {},
    sidebarCollapsed: false,
    drawerOpen: false,
  });

  // Update breakpoint when screen size changes
  useEffect(() => {
    const newBreakpoint = getCurrentBreakpoint();
    
    setState(prev => ({
      ...prev,
      currentBreakpoint: newBreakpoint,
      // Auto-close drawer when switching to desktop
      drawerOpen: newBreakpoint === 'desktop' ? false : prev.drawerOpen,
    }));
  }, [isMobile, isTablet, isDesktop]);

  // Update active section based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = findActiveItem(items, currentPath);
    
    if (activeItem) {
      setState(prev => ({
        ...prev,
        activeSection: activeItem.id,
      }));
    }
  }, [location.pathname, items]);

  // Helper function to find active navigation item
  const findActiveItem = (navItems: NavigationItem[], path: string): NavigationItem | undefined => {
    for (const item of navItems) {
      // Check exact match or path starts with item href
      if (path === item.href || (item.href !== '/' && path.startsWith(item.href))) {
        return item;
      }
      
      // Check children recursively
      if (item.children) {
        const childMatch = findActiveItem(item.children, path);
        if (childMatch) return childMatch;
      }
    }
    return undefined;
  };

  // Navigation actions
  const toggleSidebar = () => {
    setState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed,
    }));
  };

  const toggleDrawer = () => {
    setState(prev => ({
      ...prev,
      drawerOpen: !prev.drawerOpen,
    }));
  };

  const closeSidebar = () => {
    setState(prev => ({
      ...prev,
      sidebarCollapsed: true,
    }));
  };

  const closeDrawer = () => {
    setState(prev => ({
      ...prev,
      drawerOpen: false,
    }));
  };

  const setActiveSection = (sectionId: string) => {
    setState(prev => ({
      ...prev,
      activeSection: sectionId,
    }));
  };

  const updateNotifications = (itemId: string, count: number) => {
    setState(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [itemId]: count,
      },
    }));
  };

  // Utility functions
  const isActive = (href: string): boolean => {
    const currentPath = location.pathname;
    return currentPath === href || (href !== '/' && currentPath.startsWith(href));
  };

  const getActiveItem = (): NavigationItem | undefined => {
    return findActiveItem(items, location.pathname);
  };

  const canAccess = (item: NavigationItem, role: string = userRole): boolean => {
    if (!item.role) return true; // Public items
    
    const roleHierarchy = {
      'tenant': 1,
      'user': 2,
      'manager': 3,
      'admin': 4,
    };
    
    const userLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 1;
    const requiredLevel = roleHierarchy[item.role as keyof typeof roleHierarchy] || 1;
    
    return userLevel >= requiredLevel;
  };

  // Context value
  const contextValue: NavigationContextType = {
    state,
    items: items.filter(item => canAccess(item)),
    toggleSidebar,
    toggleDrawer,
    closeSidebar,
    closeDrawer,
    setActiveSection,
    updateNotifications,
    isActive,
    getActiveItem,
    canAccess,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationProvider;