// PropertyFlow AI Theme Hook
// Custom hook for accessing and managing theme state

import { useCallback, useEffect, useState } from 'react';
import { ThemeMode, themes, getCSSCustomProperties } from './themeConfig';
import { ThemeContextType } from './ThemeContext';

// Storage keys
const STORAGE_KEY = 'propertyflow-theme';
const STORAGE_KEY_SYSTEM = 'propertyflow-use-system';

// Utility functions
const getSystemTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
};

const getStoredTheme = (): ThemeMode | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
  } catch {
    return null;
  }
};

const getStoredSystemPreference = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SYSTEM);
    return stored !== 'false';
  } catch {
    return true;
  }
};

const setStoredTheme = (theme: ThemeMode): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to store theme preference:', error);
  }
};

const setStoredSystemPreference = (useSystem: boolean): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY_SYSTEM, String(useSystem));
  } catch (error) {
    console.warn('Failed to store system theme preference:', error);
  }
};

// Apply CSS custom properties to document root
const applyCSSCustomProperties = (theme: ThemeMode): void => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const themeConfig = themes[theme];
  const customProperties = getCSSCustomProperties(themeConfig);
  
  // Apply theme data attribute
  root.setAttribute('data-theme', theme);
  
  // Apply custom properties with transition
  root.style.setProperty('--theme-transition', 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease');
  
  Object.entries(customProperties).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

// Main theme hook
export const useTheme = (): ThemeContextType => {
  // Initialize state
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(() => getSystemTheme());
  const [isSystemTheme, setIsSystemTheme] = useState(() => getStoredSystemPreference());
  const [manualTheme, setManualTheme] = useState<ThemeMode>(() => {
    const stored = getStoredTheme();
    return stored || getSystemTheme();
  });

  // Current active theme
  const theme = isSystemTheme ? systemTheme : manualTheme;

  // System theme detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
    };

    // Set initial system theme
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // Listen for system theme changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // Apply theme changes to DOM
  useEffect(() => {
    applyCSSCustomProperties(theme);
  }, [theme]);

  // Theme management functions
  const setTheme = useCallback((newTheme: ThemeMode | 'system') => {
    if (newTheme === 'system') {
      setIsSystemTheme(true);
      setStoredSystemPreference(true);
    } else {
      setIsSystemTheme(false);
      setManualTheme(newTheme);
      setStoredTheme(newTheme);
      setStoredSystemPreference(false);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Computed values
  const isDarkMode = theme === 'dark';
  const isLightMode = theme === 'light';

  return {
    theme,
    systemTheme,
    setTheme,
    toggleTheme,
    isSystemTheme,
    isDarkMode,
    isLightMode,
  };
};