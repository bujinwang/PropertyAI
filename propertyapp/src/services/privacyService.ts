import { apiService } from './apiService';

export interface PrivacySettings {
  dataCollection: 'minimal' | 'standard' | 'full';
  locationTracking: boolean;
  deviceInfo: boolean;
  searchHistory: boolean;
  thirdPartySharing: boolean;
  adPersonalization: boolean;
  profileIndexing: boolean;
  cookieSettings: {
    essential: boolean; // Cannot be disabled
    functional: boolean;
    analytics: boolean;
    advertising: boolean;
  };
}

export interface PrivacySettingCategory {
  id: keyof PrivacySettings | keyof PrivacySettings['cookieSettings'];
  title: string;
  description: string;
  dataImpact: 'high' | 'medium' | 'low';
  userExperienceImpact: 'high' | 'medium' | 'low';
  isRequired: boolean;
  parentCategory?: keyof PrivacySettings;
}

// Default privacy settings
export const defaultPrivacySettings: PrivacySettings = {
  dataCollection: 'standard',
  locationTracking: false,
  deviceInfo: true,
  searchHistory: true,
  thirdPartySharing: false,
  adPersonalization: false,
  profileIndexing: true,
  cookieSettings: {
    essential: true, // Cannot be changed
    functional: true,
    analytics: true,
    advertising: false
  }
};

// Detailed descriptions of privacy settings
export const privacySettingsCategories: PrivacySettingCategory[] = [
  {
    id: 'dataCollection',
    title: 'Data Collection Level',
    description: 'Controls how much data we collect about your app usage and interactions.',
    dataImpact: 'high',
    userExperienceImpact: 'high',
    isRequired: false
  },
  {
    id: 'locationTracking',
    title: 'Location Tracking',
    description: 'Allows the app to use your location to provide location-based services and property recommendations.',
    dataImpact: 'high',
    userExperienceImpact: 'medium',
    isRequired: false
  },
  {
    id: 'deviceInfo',
    title: 'Device Information',
    description: 'Collects information about your device to optimize the app and troubleshoot issues.',
    dataImpact: 'medium',
    userExperienceImpact: 'low',
    isRequired: false
  },
  {
    id: 'searchHistory',
    title: 'Search History',
    description: 'Saves your search history to provide better recommendations and faster access to previous searches.',
    dataImpact: 'medium',
    userExperienceImpact: 'high',
    isRequired: false
  },
  {
    id: 'thirdPartySharing',
    title: 'Third-Party Data Sharing',
    description: 'Allows sharing of your data with trusted third-party partners for additional services.',
    dataImpact: 'high',
    userExperienceImpact: 'low',
    isRequired: false
  },
  {
    id: 'adPersonalization',
    title: 'Ad Personalization',
    description: 'Uses your activity to show more relevant ads and content that matches your interests.',
    dataImpact: 'medium',
    userExperienceImpact: 'medium',
    isRequired: false
  },
  {
    id: 'profileIndexing',
    title: 'Profile Indexing',
    description: 'Allows your profile to be discoverable by other users or services within the platform.',
    dataImpact: 'medium',
    userExperienceImpact: 'high',
    isRequired: false
  },
  {
    id: 'essential',
    title: 'Essential Cookies',
    description: 'Required cookies that enable basic functionality of the website.',
    dataImpact: 'low',
    userExperienceImpact: 'high',
    isRequired: true,
    parentCategory: 'cookieSettings'
  },
  {
    id: 'functional',
    title: 'Functional Cookies',
    description: 'Cookies that enhance functionality and personalization of the website.',
    dataImpact: 'medium',
    userExperienceImpact: 'medium',
    isRequired: false,
    parentCategory: 'cookieSettings'
  },
  {
    id: 'analytics',
    title: 'Analytics Cookies',
    description: 'Cookies that help analyze how you use the website to improve it.',
    dataImpact: 'medium',
    userExperienceImpact: 'low',
    isRequired: false,
    parentCategory: 'cookieSettings'
  },
  {
    id: 'advertising',
    title: 'Advertising Cookies',
    description: 'Cookies used to show personalized advertisements.',
    dataImpact: 'high',
    userExperienceImpact: 'low',
    isRequired: false,
    parentCategory: 'cookieSettings'
  }
];

// Information about data collection levels
export const dataCollectionLevels = {
  minimal: {
    title: 'Minimal',
    description: 'Collects only essential data required for the app to function. Features like personalized recommendations may be limited.',
    dataCollected: ['Account Information', 'Transaction Data', 'Basic Usage Statistics'],
    features: ['Basic App Functionality', 'Account Management', 'Core Features']
  },
  standard: {
    title: 'Standard',
    description: 'Balanced data collection that enables personalization while respecting privacy. Recommended for most users.',
    dataCollected: ['Account Information', 'Transaction Data', 'Usage Statistics', 'Preferences', 'Limited Behavioral Data'],
    features: ['All Core Features', 'Basic Personalization', 'Search Optimization', 'Limited AI Features']
  },
  full: {
    title: 'Full',
    description: 'Comprehensive data collection that enables all personalization and AI features for the best experience.',
    dataCollected: ['Account Information', 'Transaction Data', 'Usage Statistics', 'Preferences', 'Behavioral Data', 'Interaction Patterns'],
    features: ['All Core Features', 'Advanced Personalization', 'Full AI Features', 'Smart Recommendations', 'Predictive Features']
  }
};

/**
 * Fetch the user's current privacy settings
 */
export const fetchPrivacySettings = async (): Promise<PrivacySettings> => {
  try {
    const response = await apiService.get<{ settings: PrivacySettings }>('/user/privacy-settings');
    return response.data.settings;
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    // Return default settings if we can't fetch from the server
    return { ...defaultPrivacySettings };
  }
};

/**
 * Update the user's privacy settings
 */
export const updatePrivacySettings = async (settings: PrivacySettings): Promise<PrivacySettings> => {
  try {
    // Always ensure essential cookies are enabled
    const updatedSettings: PrivacySettings = {
      ...settings,
      cookieSettings: {
        ...settings.cookieSettings,
        essential: true // Force essential cookies to be true
      }
    };
    
    const response = await apiService.put<{ settings: PrivacySettings }>('/user/privacy-settings', { settings: updatedSettings });
    return response.data.settings;
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    throw error;
  }
};

/**
 * Get the impact description based on the level
 */
export const getImpactDescription = (level: 'high' | 'medium' | 'low', type: 'data' | 'experience'): string => {
  if (type === 'data') {
    switch (level) {
      case 'high':
        return 'Significant data collection and processing';
      case 'medium':
        return 'Moderate data collection and processing';
      case 'low':
        return 'Minimal data collection and processing';
    }
  } else {
    switch (level) {
      case 'high':
        return 'Major impact on app functionality and personalization';
      case 'medium':
        return 'Moderate impact on app functionality and personalization';
      case 'low':
        return 'Minimal impact on app functionality and personalization';
    }
  }
};

/**
 * Export privacy settings in a portable format
 */
export const exportPrivacySettings = async (): Promise<Blob> => {
  try {
    const response = await apiService.get('/user/privacy-settings/export', {
      responseType: 'blob'
    });
    return response.data as Blob;
  } catch (error) {
    console.error('Error exporting privacy settings:', error);
    throw error;
  }
}; 