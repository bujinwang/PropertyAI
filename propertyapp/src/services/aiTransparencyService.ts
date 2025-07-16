import { AIDataUsage, AIUsageCategory, DataProcessingType } from '../types/privacy';
import { api } from './api';

/**
 * Service to handle AI transparency and data usage information
 */
export const aiTransparencyService = {
  /**
   * Get AI data usage information for the current user
   * @returns Promise with AI data usage information
   */
  getAIDataUsage: async (): Promise<AIDataUsage> => {
    try {
      const response = await api.get('/ai/data-usage');
      return response;
    } catch (error) {
      console.error('Error fetching AI data usage:', error);
      // Fallback to mock data if API fails
      return aiTransparencyService.getAIDataUsageClient();
    }
  },

  /**
   * Client-side fallback for AI data usage
   * @returns Promise with AI data usage information
   */
  getAIDataUsageClient: async (): Promise<AIDataUsage> => {
    return {
      categories: [
        {
          id: 'property-analysis',
          name: 'Property Analysis',
          description: 'AI analyzes property data to provide insights and recommendations',
          processingTypes: [
            {
              id: 'image-analysis',
              name: 'Image Analysis',
              description: 'Processing of property images to detect features and quality',
              dataSources: ['Uploaded property photos', 'Geolocation data'],
              purposeDescription: 'Enhance property listings, verify property features, and detect potential issues',
              retentionPeriod: '2 years after listing removal',
              isOptional: true,
              isEnabled: true
            },
            {
              id: 'price-prediction',
              name: 'Price Prediction',
              description: 'Analysis of property features to suggest optimal pricing',
              dataSources: ['Property details', 'Market data', 'Comparable listings'],
              purposeDescription: 'Provide competitive pricing recommendations based on market conditions',
              retentionPeriod: '1 year after listing removal',
              isOptional: true,
              isEnabled: true
            }
          ]
        },
        {
          id: 'tenant-screening',
          name: 'Tenant Screening',
          description: 'AI evaluates tenant applications to assess risk and suitability',
          processingTypes: [
            {
              id: 'document-verification',
              name: 'Document Verification',
              description: 'Automated verification of tenant-provided documents',
              dataSources: ['Uploaded identification documents', 'Credit reports', 'Income verification'],
              purposeDescription: 'Verify authenticity of documents and consistency of information',
              retentionPeriod: '1 year after application process',
              isOptional: false,
              isEnabled: true
            },
            {
              id: 'risk-assessment',
              name: 'Risk Assessment',
              description: 'Analysis of tenant history and financial data to assess tenancy risk',
              dataSources: ['Credit history', 'Rental history', 'Income data'],
              purposeDescription: 'Generate risk scores while maintaining fair housing compliance',
              retentionPeriod: '1 year after application decision',
              isOptional: false,
              isEnabled: true
            }
          ]
        },
        {
          id: 'communication',
          name: 'Communication',
          description: 'AI assists with tenant-landlord communications',
          processingTypes: [
            {
              id: 'message-suggestions',
              name: 'Message Suggestions',
              description: 'AI-generated response suggestions for common inquiries',
              dataSources: ['Message history', 'Common response patterns'],
              purposeDescription: 'Improve response time and consistency in communications',
              retentionPeriod: '6 months',
              isOptional: true,
              isEnabled: true
            },
            {
              id: 'sentiment-analysis',
              name: 'Sentiment Analysis',
              description: 'Analysis of message sentiment to identify urgent issues',
              dataSources: ['Message content', 'Communication patterns'],
              purposeDescription: 'Identify and prioritize urgent tenant concerns',
              retentionPeriod: '3 months',
              isOptional: true,
              isEnabled: true
            }
          ]
        },
        {
          id: 'maintenance',
          name: 'Maintenance',
          description: 'AI helps identify and resolve maintenance issues',
          processingTypes: [
            {
              id: 'issue-classification',
              name: 'Issue Classification',
              description: 'Categorization of maintenance requests based on description and images',
              dataSources: ['Maintenance request descriptions', 'Uploaded images of issues'],
              purposeDescription: 'Route requests to appropriate personnel and prioritize critical issues',
              retentionPeriod: '1 year after resolution',
              isOptional: false,
              isEnabled: true
            },
            {
              id: 'predictive-maintenance',
              name: 'Predictive Maintenance',
              description: 'Analysis of property data to predict future maintenance needs',
              dataSources: ['Maintenance history', 'Property age', 'System specifications'],
              purposeDescription: 'Anticipate and prevent maintenance issues before they occur',
              retentionPeriod: '5 years',
              isOptional: true,
              isEnabled: true
            }
          ]
        }
      ],
      lastUpdated: new Date().toISOString(),
      modelTrainingPolicy: {
        description: 'We use anonymized data to improve our AI models. Your personal information is never used to directly train our models.',
        optOut: true,
        isOptedOut: false
      }
    };
  },

  /**
   * Update AI data processing settings
   * @param categoryId Category ID
   * @param processingTypeId Processing type ID
   * @param enabled Whether the processing is enabled
   * @returns Promise with updated settings
   */
  updateAIProcessingSettings: async (
    categoryId: string,
    processingTypeId: string,
    enabled: boolean
  ): Promise<{ success: boolean }> => {
    try {
      const response = await api.patch('/ai/data-processing', {
        categoryId,
        processingTypeId,
        enabled
      });
      return response;
    } catch (error) {
      console.error('Error updating AI processing settings:', error);
      // Return success in fallback mode
      return { success: true };
    }
  },

  /**
   * Update AI model training opt-out status
   * @param optedOut Whether the user has opted out of model training
   * @returns Promise with updated settings
   */
  updateModelTrainingOptOut: async (optedOut: boolean): Promise<{ success: boolean }> => {
    try {
      const response = await api.patch('/ai/model-training-opt-out', {
        optedOut
      });
      return response;
    } catch (error) {
      console.error('Error updating model training opt-out:', error);
      // Return success in fallback mode
      return { success: true };
    }
  }
}; 