import { apiService } from './apiService';

export interface ConsentPreferences {
  marketing: boolean;      // Email marketing, notifications, promotional offers
  analytics: boolean;      // Usage analytics and app performance monitoring
  thirdParty: boolean;     // Sharing data with trusted third parties
  profileEnrichment: boolean; // Enhancing user profiles with additional data
  aiProcessing: boolean;   // Using data to train AI models
  locationData: boolean;   // Collecting and processing location data
}

export interface ConsentDescription {
  id: keyof ConsentPreferences;
  title: string;
  description: string;
  importance: 'essential' | 'functional' | 'optional';
  dataCategories: string[];
  retention: string;
  defaultValue: boolean;
}

// Detailed descriptions of each consent type
export const consentDescriptions: ConsentDescription[] = [
  {
    id: 'marketing',
    title: 'Marketing Communications',
    description: 'Allow us to send you marketing emails, notifications, and promotional offers tailored to your interests and usage patterns.',
    importance: 'optional',
    dataCategories: ['Contact Information', 'User Preferences', 'Usage History'],
    retention: '3 years after last interaction',
    defaultValue: false
  },
  {
    id: 'analytics',
    title: 'Analytics & Performance',
    description: 'Allow us to collect usage data to improve our services, understand user behavior, and optimize the application experience.',
    importance: 'functional',
    dataCategories: ['Usage Statistics', 'Device Information', 'Feature Interaction'],
    retention: '18 months',
    defaultValue: true
  },
  {
    id: 'thirdParty',
    title: 'Third-Party Sharing',
    description: 'Allow us to share your data with trusted third parties for services like payment processing, credit checks, and background verification.',
    importance: 'optional',
    dataCategories: ['Personal Information', 'Transaction History', 'Account Details'],
    retention: 'Duration of service usage',
    defaultValue: false
  },
  {
    id: 'profileEnrichment',
    title: 'Profile Enrichment',
    description: 'Allow us to enhance your profile with additional data from various sources to provide personalized recommendations and improve service quality.',
    importance: 'functional',
    dataCategories: ['User Preferences', 'Behavioral Patterns', 'Service Usage'],
    retention: 'Duration of account activity',
    defaultValue: true
  },
  {
    id: 'aiProcessing',
    title: 'AI Data Processing',
    description: 'Allow us to use your anonymized data to train and improve our AI systems, enabling better recommendations and automated features.',
    importance: 'functional',
    dataCategories: ['Anonymized User Data', 'Interaction Patterns', 'Feature Preferences'],
    retention: '24 months',
    defaultValue: true
  },
  {
    id: 'locationData',
    title: 'Location Data',
    description: 'Allow us to collect and process your location data to provide location-based services and property recommendations nearby.',
    importance: 'optional',
    dataCategories: ['Geolocation', 'Address Information', 'Search Locations'],
    retention: '12 months',
    defaultValue: false
  }
];

// Default consent preferences
export const defaultConsentPreferences: ConsentPreferences = {
  marketing: false,
  analytics: true,
  thirdParty: false,
  profileEnrichment: true,
  aiProcessing: true,
  locationData: false
};

/**
 * Fetch the user's current consent preferences
 */
export const fetchConsentPreferences = async (): Promise<ConsentPreferences> => {
  try {
    const response = await apiService.get<{ preferences: ConsentPreferences }>('/user/consent');
    return response.data.preferences;
  } catch (error) {
    console.error('Error fetching consent preferences:', error);
    // Return default preferences if we can't fetch from the server
    return { ...defaultConsentPreferences };
  }
};

/**
 * Update the user's consent preferences
 */
export const updateConsentPreferences = async (preferences: ConsentPreferences): Promise<ConsentPreferences> => {
  try {
    const response = await apiService.put<{ preferences: ConsentPreferences }>('/user/consent', { preferences });
    return response.data.preferences;
  } catch (error) {
    console.error('Error updating consent preferences:', error);
    throw error;
  }
};

/**
 * Get the description for a specific consent type
 */
export const getConsentDescription = (consentType: keyof ConsentPreferences): ConsentDescription | undefined => {
  return consentDescriptions.find(desc => desc.id === consentType);
};

/**
 * Get consent history for a user
 */
export const getConsentHistory = async (): Promise<Array<{
  timestamp: string;
  changes: Partial<ConsentPreferences>;
  ipAddress: string;
  device: string;
}>> => {
  try {
    const response = await apiService.get<{
      history: Array<{
        timestamp: string;
        changes: Partial<ConsentPreferences>;
        ipAddress: string;
        device: string;
      }>;
    }>('/user/consent/history');
    return response.data.history;
  } catch (error) {
    console.error('Error fetching consent history:', error);
    return [];
  }
};

/**
 * Export consent data in a portable format
 */
export const exportConsentData = async (): Promise<Blob> => {
  try {
    const response = await apiService.get('/user/consent/export', {
      responseType: 'blob'
    });
    return response.data as Blob;
  } catch (error) {
    console.error('Error exporting consent data:', error);
    throw error;
  }
}; 