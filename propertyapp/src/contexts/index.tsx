import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AppSettingsProvider } from './AppSettingsContext';

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <AppSettingsProvider>
        {children}
      </AppSettingsProvider>
    </AuthProvider>
  );
};

// Export all context hooks for easy import
export { useAuth } from './AuthContext';
export { useAppSettings } from './AppSettingsContext'; 