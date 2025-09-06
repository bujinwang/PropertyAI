// PropertyFlow AI Theme Context
// React Context for global theme management

import React, { createContext, useContext, ReactNode } from 'react';
import { ThemeMode } from './themeConfig';

export interface ThemeContextType {
  theme: ThemeMode;
  systemTheme: ThemeMode;
  setTheme: (theme: ThemeMode | 'system') => void;
  toggleTheme: () => void;
  isSystemTheme: boolean;
  isDarkMode: boolean;
  isLightMode: boolean;
}

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme context hook with error handling
export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error(
      'useThemeContext must be used within a PropertyFlowThemeProvider. ' +
      'Make sure your app is wrapped with <PropertyFlowThemeProvider>.'
    );
  }
  
  return context;
};

// Theme context provider props
export interface ThemeContextProviderProps {
  children: ReactNode;
  value: ThemeContextType;
}

// Theme context provider component
export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ 
  children, 
  value 
}) => {
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;