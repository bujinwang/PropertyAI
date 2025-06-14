import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AppSettingsProvider } from './AppSettingsContext';
import { ThemeProvider } from './ThemeContext';

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppSettingsProvider>
          {children}
        </AppSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Export all context hooks for easy import
export { useAuth } from './AuthContext';
export { useAppSettings } from './AppSettingsContext';
export { useTheme } from './ThemeContext'; 