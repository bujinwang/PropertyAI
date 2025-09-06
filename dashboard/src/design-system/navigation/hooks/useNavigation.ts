// PropertyFlow AI Navigation Hooks
// Utility hooks for navigation functionality

import { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationContext, NavigationContextType, NavigationItem } from '../NavigationProvider';

/**
 * Hook to access navigation context
 * Re-export from NavigationProvider for convenience
 */
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

/**
 * Hook for programmatic navigation with navigation context integration
 */
export const useNavigationActions = () => {
  const navigate = useNavigate();
  const { setActiveSection, updateNotifications } = useNavigation();

  const navigateToSection = (href: string, sectionId?: string) => {
    navigate(href);
    if (sectionId) {
      setActiveSection(sectionId);
    }
  };

  const navigateWithNotification = (href: string, sectionId?: string, clearNotifications = false) => {
    navigateToSection(href, sectionId);
    if (clearNotifications && sectionId) {
      updateNotifications(sectionId, 0);
    }
  };

  return {
    navigateToSection,
    navigateWithNotification,
  };
};

/**
 * Hook for breadcrumb generation based on current navigation state
 */
export const useBreadcrumbs = () => {
  const { items, getActiveItem } = useNavigation();
  const location = useLocation();

  const generateBreadcrumbs = (): NavigationItem[] => {
    const breadcrumbs: NavigationItem[] = [];
    const currentPath = location.pathname;

    // Find the current item in navigation hierarchy
    const findItemPath = (navItems: NavigationItem[], path: string, currentBreadcrumbs: NavigationItem[] = []): NavigationItem[] | null => {
      for (const item of navItems) {
        const newBreadcrumbs = [...currentBreadcrumbs, item];
        
        // Check if this is the current item
        if (path === item.href || (item.href !== '/' && path.startsWith(item.href))) {
          return newBreadcrumbs;
        }
        
        // Check children
        if (item.children) {
          const childResult = findItemPath(item.children, path, newBreadcrumbs);
          if (childResult) {
            return childResult;
          }
        }
      }
      
      return null;
    };

    const result = findItemPath(items, currentPath);
    return result || [];
  };

  const breadcrumbs = generateBreadcrumbs();
  const activeItem = getActiveItem();

  return {
    breadcrumbs,
    activeItem,
    currentPath: location.pathname,
  };
};

/**
 * Hook for navigation search functionality
 */
export const useNavigationSearch = () => {
  const { items } = useNavigation();
  const navigate = useNavigate();

  const searchNavigationItems = (query: string): NavigationItem[] => {
    if (!query.trim()) return [];

    const searchRecursive = (navItems: NavigationItem[]): NavigationItem[] => {
      const results: NavigationItem[] = [];

      for (const item of navItems) {
        // Search in label and description
        const matchesLabel = item.label.toLowerCase().includes(query.toLowerCase());
        const matchesDescription = item.description?.toLowerCase().includes(query.toLowerCase());
        
        if (matchesLabel || matchesDescription) {
          results.push(item);
        }

        // Search in children
        if (item.children) {
          results.push(...searchRecursive(item.children));
        }
      }

      return results;
    };

    return searchRecursive(items);
  };

  const navigateToSearchResult = (item: NavigationItem) => {
    if (item.isExternal) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    } else {
      navigate(item.href);
    }
  };

  return {
    searchNavigationItems,
    navigateToSearchResult,
  };
};

/**
 * Hook for responsive navigation behavior detection
 */
export const useNavigationBreakpoint = () => {
  const { state } = useNavigation();
  
  const isDesktop = state.currentBreakpoint === 'desktop';
  const isTablet = state.currentBreakpoint === 'tablet';
  const isMobile = state.currentBreakpoint === 'mobile';

  const shouldShowSidebar = isDesktop;
  const shouldShowDrawer = isTablet;
  const shouldShowBottomTabs = isMobile;

  return {
    currentBreakpoint: state.currentBreakpoint,
    isDesktop,
    isTablet,
    isMobile,
    shouldShowSidebar,
    shouldShowDrawer,
    shouldShowBottomTabs,
  };
};

/**
 * Hook for navigation keyboard shortcuts
 */
export const useNavigationShortcuts = () => {
  const { items } = useNavigation();
  const navigate = useNavigate();

  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    // Only handle shortcuts with Alt key to avoid conflicts
    if (!event.altKey) return;

    // Map number keys to navigation items
    const shortcutMap: Record<string, string> = {
      'Digit1': items[0]?.href || '/',
      'Digit2': items[1]?.href || '',
      'Digit3': items[2]?.href || '',
      'Digit4': items[3]?.href || '',
      'Digit5': items[4]?.href || '',
    };

    const targetHref = shortcutMap[event.code];
    if (targetHref) {
      event.preventDefault();
      navigate(targetHref);
    }
  };

  // Register keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [items]);

  return {
    shortcuts: items.slice(0, 5).map((item, index) => ({
      key: `Alt+${index + 1}`,
      label: item.label,
      href: item.href,
    })),
  };
};