import { apiService } from './apiService';

/**
 * Data types covered by retention policies
 */
export enum DataType {
  ACCOUNT_DATA = 'ACCOUNT_DATA',
  PERSONAL_DATA = 'PERSONAL_DATA',
  PAYMENT_DATA = 'PAYMENT_DATA',
  COMMUNICATION_DATA = 'COMMUNICATION_DATA',
  PROPERTY_DATA = 'PROPERTY_DATA',
  USAGE_DATA = 'USAGE_DATA',
  ANALYTICS_DATA = 'ANALYTICS_DATA',
  MARKETING_DATA = 'MARKETING_DATA',
  LOCATION_DATA = 'LOCATION_DATA',
  DEVICE_DATA = 'DEVICE_DATA'
}

/**
 * Retention period type
 */
export enum RetentionPeriodType {
  PERMANENT = 'PERMANENT',
  YEARS = 'YEARS',
  MONTHS = 'MONTHS',
  DAYS = 'DAYS',
  UNTIL_ACCOUNT_CLOSURE = 'UNTIL_ACCOUNT_CLOSURE',
  CUSTOM = 'CUSTOM'
}

/**
 * Retention trigger type
 */
export enum RetentionTrigger {
  COLLECTION = 'COLLECTION', // From time of collection
  LAST_USE = 'LAST_USE', // From time of last use
  ACCOUNT_DELETION = 'ACCOUNT_DELETION', // After account deletion
  CONTRACT_END = 'CONTRACT_END', // After contract/lease ends
  SPECIFIC_EVENT = 'SPECIFIC_EVENT' // After a specific event
}

/**
 * Legal basis for data retention
 */
export enum LegalBasis {
  LEGITIMATE_INTEREST = 'LEGITIMATE_INTEREST',
  LEGAL_OBLIGATION = 'LEGAL_OBLIGATION',
  CONTRACT_FULFILLMENT = 'CONTRACT_FULFILLMENT',
  CONSENT = 'CONSENT',
  VITAL_INTEREST = 'VITAL_INTEREST',
  PUBLIC_INTEREST = 'PUBLIC_INTEREST'
}

/**
 * Data storage location
 */
export enum StorageLocation {
  CLOUD_US = 'CLOUD_US',
  CLOUD_EU = 'CLOUD_EU',
  CLOUD_ASIA = 'CLOUD_ASIA',
  ON_PREMISE = 'ON_PREMISE',
  THIRD_PARTY = 'THIRD_PARTY',
  DISTRIBUTED = 'DISTRIBUTED'
}

/**
 * Retention policy interface
 */
export interface RetentionPolicy {
  dataType: DataType;
  retentionPeriod: {
    type: RetentionPeriodType;
    duration?: number; // Only applicable for YEARS, MONTHS, DAYS
    customDescription?: string; // Only applicable for CUSTOM
  };
  trigger: RetentionTrigger;
  legalBasis: LegalBasis;
  storageLocation: StorageLocation;
  description: string;
  appliesTo: string[];
  exceptionCriteria?: string[];
  autoDeleteEnabled: boolean;
  canRequestEarlyDeletion: boolean;
}

/**
 * Retention statistics
 */
export interface RetentionStatistics {
  totalDataTypes: number;
  averageRetentionPeriodInDays: number;
  dataTypesWithAutoDelete: number;
  dataByLegalBasis: Record<LegalBasis, number>;
  dataByLocation: Record<StorageLocation, number>;
}

/**
 * Individual data items that can be affected by retention policies
 */
export interface RetentionDataItem {
  id: string;
  dataType: DataType;
  description: string;
  collectionDate: Date;
  lastUsedDate: Date | null;
  expiryDate: Date | null;
  storageLocation: StorageLocation;
  size: string; // e.g., "2.5 MB"
  status: 'active' | 'pending_deletion' | 'archived';
}

/**
 * Data type information
 */
export interface DataTypeInfo {
  id: DataType;
  title: string;
  description: string;
  examples: string[];
  typical_retention: string;
  sensitivity: 'high' | 'medium' | 'low';
  encryption: boolean;
  regulations: string[];
}

/**
 * Data type descriptions
 */
export const dataTypeInfo: Record<DataType, DataTypeInfo> = {
  [DataType.ACCOUNT_DATA]: {
    id: DataType.ACCOUNT_DATA,
    title: 'Account Data',
    description: 'Basic information related to your account',
    examples: ['Username', 'Email', 'Account Creation Date', 'Account Settings'],
    typical_retention: 'Until account deletion + 30 days',
    sensitivity: 'medium',
    encryption: true,
    regulations: ['GDPR', 'CCPA', 'PIPEDA']
  },
  [DataType.PERSONAL_DATA]: {
    id: DataType.PERSONAL_DATA,
    title: 'Personal Data',
    description: 'Personally identifiable information',
    examples: ['Name', 'Address', 'Phone Number', 'Date of Birth', 'Government ID'],
    typical_retention: 'Until account deletion + 90 days',
    sensitivity: 'high',
    encryption: true,
    regulations: ['GDPR', 'CCPA', 'HIPAA', 'PIPEDA']
  },
  [DataType.PAYMENT_DATA]: {
    id: DataType.PAYMENT_DATA,
    title: 'Payment Data',
    description: 'Information related to payments and financial transactions',
    examples: ['Payment Methods', 'Transaction History', 'Billing Address', 'Payment Confirmations'],
    typical_retention: '7 years (for tax purposes)',
    sensitivity: 'high',
    encryption: true,
    regulations: ['GDPR', 'CCPA', 'PCI DSS', 'Tax Regulations']
  },
  [DataType.COMMUNICATION_DATA]: {
    id: DataType.COMMUNICATION_DATA,
    title: 'Communication Data',
    description: 'Records of communications between you and other users or the platform',
    examples: ['Messages', 'Emails', 'Support Tickets', 'Communication Preferences'],
    typical_retention: '3 years',
    sensitivity: 'medium',
    encryption: true,
    regulations: ['GDPR', 'CCPA', 'ePrivacy Directive']
  },
  [DataType.PROPERTY_DATA]: {
    id: DataType.PROPERTY_DATA,
    title: 'Property Data',
    description: 'Information about properties you own, manage, or interact with',
    examples: ['Property Listings', 'Property Details', 'Saved Properties', 'Property Interactions'],
    typical_retention: '5 years after last interaction',
    sensitivity: 'medium',
    encryption: true,
    regulations: ['GDPR', 'CCPA', 'Real Estate Regulations']
  },
  [DataType.USAGE_DATA]: {
    id: DataType.USAGE_DATA,
    title: 'Usage Data',
    description: 'Information about how you use the platform',
    examples: ['Feature Usage', 'Session Duration', 'Actions Performed', 'User Journey'],
    typical_retention: '2 years',
    sensitivity: 'low',
    encryption: false,
    regulations: ['GDPR', 'CCPA', 'ePrivacy Directive']
  },
  [DataType.ANALYTICS_DATA]: {
    id: DataType.ANALYTICS_DATA,
    title: 'Analytics Data',
    description: 'Aggregated and anonymized data used for analytics purposes',
    examples: ['Performance Metrics', 'Usage Patterns', 'Trend Analysis', 'Behavior Insights'],
    typical_retention: '3 years (anonymized data may be kept longer)',
    sensitivity: 'low',
    encryption: false,
    regulations: ['GDPR', 'CCPA', 'ePrivacy Directive']
  },
  [DataType.MARKETING_DATA]: {
    id: DataType.MARKETING_DATA,
    title: 'Marketing Data',
    description: 'Information used for marketing purposes',
    examples: ['Marketing Preferences', 'Campaign Interactions', 'Ad Clicks', 'Marketing Metrics'],
    typical_retention: '2 years after last interaction',
    sensitivity: 'medium',
    encryption: false,
    regulations: ['GDPR', 'CCPA', 'CAN-SPAM Act', 'ePrivacy Directive']
  },
  [DataType.LOCATION_DATA]: {
    id: DataType.LOCATION_DATA,
    title: 'Location Data',
    description: 'Information about your geographical location',
    examples: ['GPS Coordinates', 'IP-based Location', 'Property Search Location', 'Location History'],
    typical_retention: '1 year',
    sensitivity: 'high',
    encryption: true,
    regulations: ['GDPR', 'CCPA', 'ePrivacy Directive']
  },
  [DataType.DEVICE_DATA]: {
    id: DataType.DEVICE_DATA,
    title: 'Device Data',
    description: 'Information about the devices you use to access the platform',
    examples: ['Device Type', 'Operating System', 'Browser Information', 'App Version'],
    typical_retention: '2 years',
    sensitivity: 'low',
    encryption: false,
    regulations: ['GDPR', 'CCPA', 'ePrivacy Directive']
  }
};

/**
 * Legal basis information
 */
export interface LegalBasisInfo {
  id: LegalBasis;
  title: string;
  description: string;
  examples: string[];
}

/**
 * Legal basis descriptions
 */
export const legalBasisInfo: Record<LegalBasis, LegalBasisInfo> = {
  [LegalBasis.LEGITIMATE_INTEREST]: {
    id: LegalBasis.LEGITIMATE_INTEREST,
    title: 'Legitimate Interest',
    description: 'Processing is necessary for the legitimate interests of our business, as long as those interests aren\'t outweighed by your rights and freedoms.',
    examples: ['Security monitoring', 'Fraud prevention', 'Service improvements', 'Business analytics']
  },
  [LegalBasis.LEGAL_OBLIGATION]: {
    id: LegalBasis.LEGAL_OBLIGATION,
    title: 'Legal Obligation',
    description: 'Processing is necessary to comply with a legal obligation to which we are subject.',
    examples: ['Tax records', 'Real estate transaction records', 'Anti-money laundering checks', 'Court orders']
  },
  [LegalBasis.CONTRACT_FULFILLMENT]: {
    id: LegalBasis.CONTRACT_FULFILLMENT,
    title: 'Contract Fulfillment',
    description: 'Processing is necessary for the performance of a contract to which you are a party.',
    examples: ['Property management', 'Lease agreements', 'Maintenance requests', 'Payment processing']
  },
  [LegalBasis.CONSENT]: {
    id: LegalBasis.CONSENT,
    title: 'Consent',
    description: 'You have given clear consent for us to process your personal data for a specific purpose.',
    examples: ['Marketing communications', 'Analytics cookies', 'Location tracking', 'Third-party data sharing']
  },
  [LegalBasis.VITAL_INTEREST]: {
    id: LegalBasis.VITAL_INTEREST,
    title: 'Vital Interest',
    description: 'Processing is necessary to protect someone\'s life or physical safety.',
    examples: ['Emergency contact information', 'Health and safety alerts', 'Crisis management']
  },
  [LegalBasis.PUBLIC_INTEREST]: {
    id: LegalBasis.PUBLIC_INTEREST,
    title: 'Public Interest',
    description: 'Processing is necessary for the performance of a task carried out in the public interest.',
    examples: ['Public housing programs', 'Government-mandated reporting', 'Housing statistics']
  }
};

/**
 * Get all retention policies
 */
export const getRetentionPolicies = async (): Promise<RetentionPolicy[]> => {
  try {
    const response = await apiService.get<{ policies: RetentionPolicy[] }>('/user/data-retention/policies');
    return response.data.policies;
  } catch (error) {
    console.error('Error fetching retention policies:', error);
    return [];
  }
};

/**
 * Get retention policy for a specific data type
 */
export const getRetentionPolicy = async (dataType: DataType): Promise<RetentionPolicy | null> => {
  try {
    const response = await apiService.get<{ policy: RetentionPolicy }>(`/user/data-retention/policies/${dataType}`);
    return response.data.policy;
  } catch (error) {
    console.error(`Error fetching retention policy for ${dataType}:`, error);
    return null;
  }
};

/**
 * Get retention statistics
 */
export const getRetentionStatistics = async (): Promise<RetentionStatistics> => {
  try {
    const response = await apiService.get<{ statistics: RetentionStatistics }>('/user/data-retention/statistics');
    return response.data.statistics;
  } catch (error) {
    console.error('Error fetching retention statistics:', error);
    
    // Return default statistics
    return {
      totalDataTypes: Object.keys(DataType).length,
      averageRetentionPeriodInDays: 0,
      dataTypesWithAutoDelete: 0,
      dataByLegalBasis: {
        [LegalBasis.LEGITIMATE_INTEREST]: 0,
        [LegalBasis.LEGAL_OBLIGATION]: 0,
        [LegalBasis.CONTRACT_FULFILLMENT]: 0,
        [LegalBasis.CONSENT]: 0,
        [LegalBasis.VITAL_INTEREST]: 0,
        [LegalBasis.PUBLIC_INTEREST]: 0
      },
      dataByLocation: {
        [StorageLocation.CLOUD_US]: 0,
        [StorageLocation.CLOUD_EU]: 0,
        [StorageLocation.CLOUD_ASIA]: 0,
        [StorageLocation.ON_PREMISE]: 0,
        [StorageLocation.THIRD_PARTY]: 0,
        [StorageLocation.DISTRIBUTED]: 0
      }
    };
  }
};

/**
 * Get data items affected by retention policies
 */
export const getRetentionDataItems = async (): Promise<RetentionDataItem[]> => {
  try {
    const response = await apiService.get<{ items: RetentionDataItem[] }>('/user/data-retention/items');
    
    // Convert date strings to Date objects
    return response.data.items.map(item => ({
      ...item,
      collectionDate: new Date(item.collectionDate),
      lastUsedDate: item.lastUsedDate ? new Date(item.lastUsedDate) : null,
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
    }));
  } catch (error) {
    console.error('Error fetching retention data items:', error);
    return [];
  }
};

/**
 * Request early deletion of a data item
 */
export const requestEarlyDeletion = async (itemId: string, reason?: string): Promise<boolean> => {
  try {
    await apiService.post(`/user/data-retention/items/${itemId}/delete`, { reason } as unknown as Record<string, unknown>);
    return true;
  } catch (error) {
    console.error(`Error requesting deletion for item ${itemId}:`, error);
    return false;
  }
};

/**
 * Get retention policy compliance information
 */
export const getRetentionComplianceInfo = async (): Promise<{ 
  compliant: boolean;
  regulations: string[];
  lastUpdated: Date;
  nextReview: Date;
  recommendations: string[];
}> => {
  try {
    const response = await apiService.get<{ 
      compliance: {
        compliant: boolean;
        regulations: string[];
        lastUpdated: string;
        nextReview: string;
        recommendations: string[];
      }
    }>('/user/data-retention/compliance');
    
    return {
      ...response.data.compliance,
      lastUpdated: new Date(response.data.compliance.lastUpdated),
      nextReview: new Date(response.data.compliance.nextReview)
    };
  } catch (error) {
    console.error('Error fetching retention compliance info:', error);
    
    return {
      compliant: true,
      regulations: ['GDPR', 'CCPA'],
      lastUpdated: new Date(),
      nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      recommendations: []
    };
  }
}; 