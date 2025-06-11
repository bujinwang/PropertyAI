import { apiService } from './apiService';

/**
 * Types of Subject Access Requests
 */
export enum SarRequestType {
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETION = 'DATA_DELETION',
  DATA_CORRECTION = 'DATA_CORRECTION',
  DATA_RESTRICTION = 'DATA_RESTRICTION',
  DATA_PORTABILITY = 'DATA_PORTABILITY'
}

/**
 * Status of Subject Access Requests
 */
export enum SarRequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DENIED = 'DENIED',
  CANCELLED = 'CANCELLED'
}

/**
 * Categories of data that can be requested
 */
export enum DataCategory {
  PERSONAL_INFO = 'PERSONAL_INFO',
  ACCOUNT_DETAILS = 'ACCOUNT_DETAILS',
  PAYMENT_INFO = 'PAYMENT_INFO', 
  COMMUNICATION_HISTORY = 'COMMUNICATION_HISTORY',
  LOGIN_HISTORY = 'LOGIN_HISTORY',
  PROPERTY_INTERACTIONS = 'PROPERTY_INTERACTIONS',
  PREFERENCES = 'PREFERENCES',
  DEVICE_INFO = 'DEVICE_INFO',
  USAGE_STATS = 'USAGE_STATS',
  ALL_DATA = 'ALL_DATA'
}

/**
 * Interface for the Subject Access Request
 */
export interface SarRequest {
  id?: string;
  type: SarRequestType;
  status: SarRequestStatus;
  categories: DataCategory[];
  requestDate: Date;
  completionDate?: Date;
  requestReason?: string;
  additionalDetails?: string;
  responseNotes?: string;
  downloadUrl?: string;
  expiryDate?: Date;
}

/**
 * Interface for creating a new SAR
 */
export interface CreateSarRequest {
  type: SarRequestType;
  categories: DataCategory[];
  requestReason?: string;
  additionalDetails?: string;
}

/**
 * Interface for SAR statistics
 */
export interface SarStatistics {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  averageCompletionTimeInDays: number;
  requestsByType: Record<SarRequestType, number>;
}

/**
 * Data category information
 */
export interface DataCategoryInfo {
  id: DataCategory;
  title: string;
  description: string;
  examples: string[];
  processingTime: string;
  dataFormat: string;
  downloadable: boolean;
}

/**
 * Descriptions of data categories
 */
export const dataCategoryInfo: Record<DataCategory, DataCategoryInfo> = {
  [DataCategory.PERSONAL_INFO]: {
    id: DataCategory.PERSONAL_INFO,
    title: 'Personal Information',
    description: 'Basic personal information associated with your account',
    examples: ['Name', 'Email', 'Phone Number', 'Address', 'Date of Birth'],
    processingTime: '1-2 business days',
    dataFormat: 'CSV, JSON',
    downloadable: true
  },
  [DataCategory.ACCOUNT_DETAILS]: {
    id: DataCategory.ACCOUNT_DETAILS,
    title: 'Account Details',
    description: 'Information about your account settings and preferences',
    examples: ['Account Creation Date', 'Account Type', 'Profile Settings', 'Notification Preferences'],
    processingTime: '1-2 business days',
    dataFormat: 'CSV, JSON',
    downloadable: true
  },
  [DataCategory.PAYMENT_INFO]: {
    id: DataCategory.PAYMENT_INFO,
    title: 'Payment Information',
    description: 'Information about your payment methods and transaction history',
    examples: ['Transaction History', 'Payment Methods (partially masked)', 'Billing Address'],
    processingTime: '2-3 business days',
    dataFormat: 'CSV, PDF',
    downloadable: true
  },
  [DataCategory.COMMUNICATION_HISTORY]: {
    id: DataCategory.COMMUNICATION_HISTORY,
    title: 'Communication History',
    description: 'Records of communications between you and the platform/other users',
    examples: ['Messages', 'Emails', 'Support Tickets', 'In-App Notifications'],
    processingTime: '3-5 business days',
    dataFormat: 'CSV, PDF, HTML',
    downloadable: true
  },
  [DataCategory.LOGIN_HISTORY]: {
    id: DataCategory.LOGIN_HISTORY,
    title: 'Login History',
    description: 'Records of your login activity',
    examples: ['Login Dates/Times', 'Devices Used', 'IP Addresses', 'Session Duration'],
    processingTime: '1-2 business days',
    dataFormat: 'CSV, JSON',
    downloadable: true
  },
  [DataCategory.PROPERTY_INTERACTIONS]: {
    id: DataCategory.PROPERTY_INTERACTIONS,
    title: 'Property Interactions',
    description: 'Records of your interactions with properties on the platform',
    examples: ['Property Views', 'Saved Properties', 'Property Inquiries', 'Application History'],
    processingTime: '2-4 business days',
    dataFormat: 'CSV, JSON',
    downloadable: true
  },
  [DataCategory.PREFERENCES]: {
    id: DataCategory.PREFERENCES,
    title: 'Preferences',
    description: 'Information about your preferences and settings',
    examples: ['Privacy Settings', 'Consent Preferences', 'Communication Preferences', 'Search Preferences'],
    processingTime: '1-2 business days',
    dataFormat: 'CSV, JSON',
    downloadable: true
  },
  [DataCategory.DEVICE_INFO]: {
    id: DataCategory.DEVICE_INFO,
    title: 'Device Information',
    description: 'Information about the devices you use to access the platform',
    examples: ['Device Type', 'Operating System', 'Browser Information', 'App Version'],
    processingTime: '1-2 business days',
    dataFormat: 'CSV, JSON',
    downloadable: true
  },
  [DataCategory.USAGE_STATS]: {
    id: DataCategory.USAGE_STATS,
    title: 'Usage Statistics',
    description: 'Information about how you use the platform',
    examples: ['Feature Usage', 'Time Spent on Platform', 'Actions Performed', 'Frequency of Use'],
    processingTime: '2-3 business days',
    dataFormat: 'CSV, JSON',
    downloadable: true
  },
  [DataCategory.ALL_DATA]: {
    id: DataCategory.ALL_DATA,
    title: 'All Data',
    description: 'All personal data we hold about you',
    examples: ['All categories listed above', 'Any additional data stored in our systems'],
    processingTime: '5-7 business days',
    dataFormat: 'ZIP (containing multiple formats)',
    downloadable: true
  }
};

/**
 * Information about SAR types
 */
export interface SarTypeInfo {
  id: SarRequestType;
  title: string;
  description: string;
  timeframe: string;
  requirements: string[];
  process: string[];
}

/**
 * Descriptions of SAR types
 */
export const sarTypeInfo: Record<SarRequestType, SarTypeInfo> = {
  [SarRequestType.DATA_EXPORT]: {
    id: SarRequestType.DATA_EXPORT,
    title: 'Data Export Request',
    description: 'Request a copy of your personal data that we hold',
    timeframe: 'Typically processed within 30 days',
    requirements: [
      'Verification of identity may be required',
      'Specification of data categories you wish to receive'
    ],
    process: [
      'Submit request with required data categories',
      'Verify your identity if requested',
      'Receive notification when data is ready',
      'Download data within the specified timeframe'
    ]
  },
  [SarRequestType.DATA_DELETION]: {
    id: SarRequestType.DATA_DELETION,
    title: 'Data Deletion Request',
    description: 'Request deletion of your personal data from our systems',
    timeframe: 'Typically processed within 30 days',
    requirements: [
      'Verification of identity may be required',
      'Account password confirmation',
      'Understanding that some data may be retained for legal or legitimate business purposes'
    ],
    process: [
      'Submit deletion request',
      'Verify your identity',
      'Review what data will be deleted vs. retained',
      'Confirm deletion request',
      'Receive confirmation when deletion is complete'
    ]
  },
  [SarRequestType.DATA_CORRECTION]: {
    id: SarRequestType.DATA_CORRECTION,
    title: 'Data Correction Request',
    description: 'Request correction of inaccurate personal data',
    timeframe: 'Typically processed within 15 days',
    requirements: [
      'Specification of what data needs correction',
      'Providing the correct information'
    ],
    process: [
      'Submit correction request with details',
      'Verify your identity if requested',
      'Review and approval of correction',
      'Receive confirmation when correction is complete'
    ]
  },
  [SarRequestType.DATA_RESTRICTION]: {
    id: SarRequestType.DATA_RESTRICTION,
    title: 'Data Processing Restriction',
    description: 'Request restriction of processing for your personal data',
    timeframe: 'Typically processed within 15 days',
    requirements: [
      'Specification of what data processing should be restricted',
      'Reason for restriction request'
    ],
    process: [
      'Submit restriction request with details',
      'Verify your identity if requested',
      'Review of restriction request',
      'Implementation of processing restrictions',
      'Receive confirmation when restriction is in place'
    ]
  },
  [SarRequestType.DATA_PORTABILITY]: {
    id: SarRequestType.DATA_PORTABILITY,
    title: 'Data Portability Request',
    description: 'Request your data in a machine-readable format to transfer to another service',
    timeframe: 'Typically processed within 30 days',
    requirements: [
      'Specification of data categories for portability',
      'Verification of identity may be required'
    ],
    process: [
      'Submit portability request with details',
      'Verify your identity if requested',
      'Data is prepared in machine-readable format',
      'Receive notification when data is ready',
      'Download data within the specified timeframe'
    ]
  }
};

/**
 * Create a new SAR
 */
export const createSarRequest = async (request: CreateSarRequest): Promise<SarRequest> => {
  try {
    // Convert to unknown first, then to the expected type
    const requestData = { ...request } as unknown as Record<string, unknown>;
    const response = await apiService.post<{ request: SarRequest }>('/user/sar', requestData);
    return response.data.request;
  } catch (error) {
    console.error('Error creating SAR request:', error);
    throw error;
  }
};

/**
 * Get all SAR requests for the current user
 */
export const getSarRequests = async (): Promise<SarRequest[]> => {
  try {
    const response = await apiService.get<{ requests: SarRequest[] }>('/user/sar');
    
    // Convert date strings to Date objects
    const requests = response.data.requests.map(request => ({
      ...request,
      requestDate: new Date(request.requestDate),
      completionDate: request.completionDate ? new Date(request.completionDate) : undefined,
      expiryDate: request.expiryDate ? new Date(request.expiryDate) : undefined
    }));
    
    return requests;
  } catch (error) {
    console.error('Error fetching SAR requests:', error);
    return [];
  }
};

/**
 * Get a specific SAR request
 */
export const getSarRequest = async (id: string): Promise<SarRequest | null> => {
  try {
    const response = await apiService.get<{ request: SarRequest }>(`/user/sar/${id}`);
    
    // Convert date strings to Date objects
    const request = {
      ...response.data.request,
      requestDate: new Date(response.data.request.requestDate),
      completionDate: response.data.request.completionDate ? new Date(response.data.request.completionDate) : undefined,
      expiryDate: response.data.request.expiryDate ? new Date(response.data.request.expiryDate) : undefined
    };
    
    return request;
  } catch (error) {
    console.error(`Error fetching SAR request ${id}:`, error);
    return null;
  }
};

/**
 * Cancel a SAR request
 */
export const cancelSarRequest = async (id: string): Promise<boolean> => {
  try {
    await apiService.post(`/user/sar/${id}/cancel`);
    return true;
  } catch (error) {
    console.error(`Error cancelling SAR request ${id}:`, error);
    return false;
  }
};

/**
 * Get statistics for the current user's SAR requests
 */
export const getSarStatistics = async (): Promise<SarStatistics> => {
  try {
    const response = await apiService.get<{ statistics: SarStatistics }>('/user/sar/statistics');
    return response.data.statistics;
  } catch (error) {
    console.error('Error fetching SAR statistics:', error);
    
    // Return default statistics
    return {
      totalRequests: 0,
      pendingRequests: 0,
      completedRequests: 0,
      averageCompletionTimeInDays: 0,
      requestsByType: {
        [SarRequestType.DATA_EXPORT]: 0,
        [SarRequestType.DATA_DELETION]: 0,
        [SarRequestType.DATA_CORRECTION]: 0,
        [SarRequestType.DATA_RESTRICTION]: 0,
        [SarRequestType.DATA_PORTABILITY]: 0
      }
    };
  }
};

/**
 * Download exported data from a completed SAR request
 */
export const downloadSarData = async (id: string): Promise<Blob> => {
  try {
    const response = await apiService.get(`/user/sar/${id}/download`, {
      responseType: 'blob'
    });
    
    // The API returns a blob, but TypeScript doesn't know that
    // So we need to cast it
    if (response.data instanceof Blob) {
      return response.data;
    }
    
    // Fallback if it's not already a Blob
    return new Blob([JSON.stringify(response.data)], { type: 'application/json' });
  } catch (error) {
    console.error(`Error downloading SAR data for request ${id}:`, error);
    throw error;
  }
}; 