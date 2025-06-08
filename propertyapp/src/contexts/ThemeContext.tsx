import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

// Default colors for light and dark themes
const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  primary: '#0066FF',
  secondary: '#00AAFF',
  accent: '#FF6600',
  border: '#DDDDDD',
  error: '#FF3B30',
  success: '#4CD964',
  warning: '#FF9500',
  inputBackground: '#F9F9F9',
  cardBackground: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

const darkTheme = {
  background: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  primary: '#0099FF',
  secondary: '#00CCFF',
  accent: '#FF9500',
  border: '#444444',
  error: '#FF453A',
  success: '#32D74B',
  warning: '#FFD60A',
  inputBackground: '#2C2C2C',
  cardBackground: '#2C2C2C',
  shadow: 'rgba(0, 0, 0, 0.5)',
};

// Theme context type
interface ThemeContextType {
  isDark: boolean;
  colors: typeof lightTheme;
  toggleTheme: () => void;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightTheme,
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get device color scheme
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  
  // Get current theme colors based on isDark state
  const colors = isDark ? darkTheme : lightTheme;
  
  // Toggle between light and dark themes
  const toggleTheme = () => {
    setIsDark(!isDark);
  };
  
  // Context value
  const contextValue: ThemeContextType = {
    isDark,
    colors,
    toggleTheme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}; 