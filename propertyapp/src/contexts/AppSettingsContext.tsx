import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types
type ThemeMode = 'light' | 'dark' | 'system';

type NotificationSettings = {
  enablePush: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
};

type AppSettings = {
  theme: ThemeMode;
  notifications: NotificationSettings;
  language: string;
};

type AppSettingsContextType = {
  settings: AppSettings;
  isLoading: boolean;
  updateTheme: (theme: ThemeMode) => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
};

// Default settings
const defaultSettings: AppSettings = {
  theme: 'system',
  notifications: {
    enablePush: true,
    enableEmail: true,
    enableSMS: false,
  },
  language: 'en',
};

// Storage keys
const SETTINGS_STORAGE_KEY = 'app_settings';

// Create context
const AppSettingsContext = createContext<AppSettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  updateTheme: async () => {},
  updateNotificationSettings: async () => {},
  updateLanguage: async () => {},
});

// Hook for easy context use
export const useAppSettings = () => useContext(AppSettingsContext);

// Provider component
type AppSettingsProviderProps = {
  children: ReactNode;
};

export const AppSettingsProvider: React.FC<AppSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('Failed to load settings', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to storage
  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings', error);
      throw error;
    }
  };

  // Update theme
  const updateTheme = async (theme: ThemeMode) => {
    const newSettings = { ...settings, theme };
    await saveSettings(newSettings);
  };

  // Update notification settings
  const updateNotificationSettings = async (notificationUpdates: Partial<NotificationSettings>) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        ...notificationUpdates,
      },
    };
    await saveSettings(newSettings);
  };

  // Update language
  const updateLanguage = async (language: string) => {
    const newSettings = { ...settings, language };
    await saveSettings(newSettings);
  };

  const value = {
    settings,
    isLoading,
    updateTheme,
    updateNotificationSettings,
    updateLanguage,
  };

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}; 