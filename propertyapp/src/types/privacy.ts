/**
 * Types for data processing in AI features
 */

/**
 * Represents a specific type of data processing performed by AI
 */
export interface DataProcessingType {
  id: string;
  name: string;
  description: string;
  dataSources: string[];
  purposeDescription: string;
  retentionPeriod: string;
  isOptional: boolean;
  isEnabled: boolean;
}

/**
 * Represents a category of AI usage within the app
 */
export interface AIUsageCategory {
  id: string;
  name: string;
  description: string;
  processingTypes: DataProcessingType[];
}

/**
 * Policy information about AI model training
 */
export interface ModelTrainingPolicy {
  description: string;
  optOut: boolean;
  isOptedOut: boolean;
}

/**
 * Comprehensive information about AI data usage for a user
 */
export interface AIDataUsage {
  categories: AIUsageCategory[];
  lastUpdated: string;
  modelTrainingPolicy: ModelTrainingPolicy;
}

/**
 * Types of subject access requests
 */
export enum SARType {
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETION = 'DATA_DELETION',
  CORRECTION = 'CORRECTION',
  RESTRICTION = 'RESTRICTION'
}

/**
 * Status of a subject access request
 */
export enum SARStatus {
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

/**
 * Subject access request details
 */
export interface SubjectAccessRequest {
  id: string;
  type: SARType;
  status: SARStatus;
  submittedDate: string;
  completedDate?: string;
  description: string;
}

/**
 * Data retention category types
 */
export interface DataRetentionCategory {
  id: string;
  name: string;
  description: string;
  retentionPeriod: string;
  dataTypes: string[];
  legalBasis: string;
}

/**
 * User privacy settings
 */
export interface PrivacySettings {
  marketingCommunications: boolean;
  dataSharing: boolean;
  locationTracking: boolean;
  analyticsCollection: boolean;
  personalization: boolean;
  aiModelTrainingOptOut?: boolean;
  [key: string]: boolean | undefined;
} 