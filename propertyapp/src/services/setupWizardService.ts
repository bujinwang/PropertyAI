import { UserRole } from '../types/auth';

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'notifications' | 'privacy' | 'security' | 'communication' | 'features';
  enabled: boolean;
  configurable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface PortfolioSize {
  properties: number;
  units: number;
}

export interface AIRecommendationRequest {
  role: UserRole;
  portfolioSize?: PortfolioSize;
  communicationPreference?: string;
}

/**
 * Service that provides AI-generated recommendations for the setup wizard
 */
const setupWizardService = {
  /**
   * Get AI-generated notification recommendations based on user role and preferences
   * @param role User role
   * @param portfolioSize Size of property portfolio (for property managers)
   * @returns Promise containing notification recommendations
   */
  getNotificationRecommendations: async (
    role: UserRole,
    portfolioSize?: PortfolioSize
  ): Promise<AIRecommendation[]> => {
    // In a real implementation, this would make an API call to an AI service
    // For now, we'll return mock data based on the role
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (role === 'tenant') {
      return [
        {
          id: 'rent_due',
          title: 'Rent Due Reminders',
          description: 'Receive notifications 5 days before rent is due',
          category: 'notifications',
          enabled: true,
          configurable: true,
          priority: 'high'
        },
        {
          id: 'maintenance_updates',
          title: 'Maintenance Request Updates',
          description: 'Get notified when there are updates to your maintenance requests',
          category: 'notifications',
          enabled: true,
          configurable: true,
          priority: 'high'
        },
        {
          id: 'community_events',
          title: 'Community Events',
          description: 'Stay informed about upcoming events in your building or community',
          category: 'notifications',
          enabled: true,
          configurable: true,
          priority: 'medium'
        },
        {
          id: 'lease_expiration',
          title: 'Lease Expiration Alerts',
          description: 'Receive reminders 60, 30, and 15 days before your lease expires',
          category: 'notifications',
          enabled: true,
          configurable: true,
          priority: 'high'
        }
      ];
    } else if (role === 'propertyManager') {
      // Adjust recommendations based on portfolio size
      const highVolume = portfolioSize && (portfolioSize.properties > 10 || portfolioSize.units > 50);
      
      return [
        {
          id: 'payment_received',
          title: 'Payment Notifications',
          description: highVolume 
            ? 'Receive daily summaries of payments received instead of individual notifications'
            : 'Get notified when rent payments are received',
          category: 'notifications',
          enabled: true,
          configurable: true,
          priority: 'high'
        },
        {
          id: 'maintenance_requests',
          title: 'Maintenance Request Alerts',
          description: highVolume
            ? 'Receive priority-based notifications for urgent maintenance issues only'
            : 'Get notified about all new maintenance requests',
          category: 'notifications',
          enabled: true,
          configurable: true,
          priority: 'high'
        },
        {
          id: 'lease_renewals',
          title: 'Lease Renewal Reminders',
          description: 'Receive alerts 90 days before tenant leases expire',
          category: 'notifications',
          enabled: true,
          configurable: true,
          priority: 'medium'
        },
        {
          id: 'vacancy_alerts',
          title: 'Vacancy Alerts',
          description: 'Get notified about upcoming vacancies and rental opportunities',
          category: 'notifications',
          enabled: true,
          configurable: true,
          priority: 'medium'
        },
        {
          id: 'market_updates',
          title: 'Market Intelligence Updates',
          description: 'Receive weekly updates on rental market trends in your properties\' areas',
          category: 'notifications',
          enabled: highVolume ? true : false,
          configurable: true,
          priority: 'low'
        }
      ];
    } else {
      // Admin role
      return [
        {
          id: 'system_alerts',
          title: 'System Alerts',
          description: 'Receive notifications about system performance and issues',
          category: 'notifications',
          enabled: true,
          configurable: true,
          priority: 'high'
        },
        {
          id: 'user_management',
          title: 'User Management Alerts',
          description: 'Get notified about new user registrations and permission changes',
          category: 'notifications',
          enabled: true,
          configurable: true,
          priority: 'high'
        },
        {
          id: 'data_privacy',
          title: 'Data Privacy Notifications',
          description: 'Receive alerts about data access requests and privacy-related activities',
          category: 'notifications',
          enabled: true,
          configurable: true,
          priority: 'high'
        }
      ];
    }
  },

  /**
   * Get AI-generated feature recommendations based on user role and preferences
   * @param request Request parameters including user role and preferences
   * @returns Promise containing feature recommendations
   */
  getFeatureRecommendations: async (
    request: AIRecommendationRequest
  ): Promise<AIRecommendation[]> => {
    // In a real implementation, this would make an API call to an AI service
    // For now, we'll return mock data based on the role
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const { role, portfolioSize, communicationPreference } = request;
    
    if (role === 'tenant') {
      return [
        {
          id: 'digital_payments',
          title: 'Digital Rent Payments',
          description: 'Enable convenient online rent payments with automatic receipts',
          category: 'features',
          enabled: true,
          configurable: false,
          priority: 'high'
        },
        {
          id: 'maintenance_tracking',
          title: 'Maintenance Request Tracking',
          description: 'Track the status of your maintenance requests in real-time',
          category: 'features',
          enabled: true,
          configurable: false,
          priority: 'high'
        },
        {
          id: 'document_storage',
          title: 'Document Storage',
          description: 'Securely store and access your lease and other important documents',
          category: 'features',
          enabled: true,
          configurable: false,
          priority: 'medium'
        },
        {
          id: 'ai_concierge',
          title: 'AI Digital Concierge',
          description: 'Get personalized recommendations for local services and amenities',
          category: 'features',
          enabled: communicationPreference === 'frequent' ? true : false,
          configurable: true,
          priority: 'low'
        }
      ];
    } else if (role === 'propertyManager') {
      // Adjust recommendations based on portfolio size
      const highVolume = portfolioSize && (portfolioSize.properties > 10 || portfolioSize.units > 50);
      
      return [
        {
          id: 'payment_tracking',
          title: 'Payment Tracking Dashboard',
          description: 'Monitor all rent payments and financial metrics in one place',
          category: 'features',
          enabled: true,
          configurable: false,
          priority: 'high'
        },
        {
          id: 'maintenance_management',
          title: 'Maintenance Management System',
          description: highVolume 
            ? 'Advanced system with vendor routing and predictive maintenance'
            : 'Basic system for tracking and managing maintenance requests',
          category: 'features',
          enabled: true,
          configurable: true,
          priority: 'high'
        },
        {
          id: 'tenant_screening',
          title: 'AI-Powered Tenant Screening',
          description: 'Automatically screen tenant applications with AI risk assessment',
          category: 'features',
          enabled: highVolume ? true : false,
          configurable: true,
          priority: 'medium'
        },
        {
          id: 'market_analytics',
          title: 'Market Analytics',
          description: 'Access rental market data and analytics for your properties\' locations',
          category: 'features',
          enabled: portfolioSize ? (portfolioSize.properties > 5 ? true : false) : false,
          configurable: true,
          priority: 'medium'
        },
        {
          id: 'ai_communication',
          title: 'AI Communication Assistant',
          description: 'Use AI to help draft and manage tenant communications',
          category: 'features',
          enabled: communicationPreference === 'efficient' ? true : false,
          configurable: true,
          priority: 'low'
        }
      ];
    } else {
      // Admin role
      return [
        {
          id: 'user_management',
          title: 'Advanced User Management',
          description: 'Comprehensive tools for managing users, roles, and permissions',
          category: 'features',
          enabled: true,
          configurable: false,
          priority: 'high'
        },
        {
          id: 'system_analytics',
          title: 'System Analytics Dashboard',
          description: 'Monitor system performance, usage patterns, and optimization opportunities',
          category: 'features',
          enabled: true,
          configurable: false,
          priority: 'high'
        },
        {
          id: 'ai_oversight',
          title: 'AI Oversight Tools',
          description: 'Advanced tools for monitoring and managing AI usage across the platform',
          category: 'features',
          enabled: true,
          configurable: true,
          priority: 'high'
        }
      ];
    }
  },

  /**
   * Get AI-generated privacy recommendations based on user role
   * @param role User role
   * @returns Promise containing privacy recommendations
   */
  getPrivacyRecommendations: async (role: UserRole): Promise<AIRecommendation[]> => {
    // In a real implementation, this would make an API call to an AI service
    // For now, we'll return mock data based on the role
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Both roles get similar privacy recommendations, with some differences
    const baseRecommendations: AIRecommendation[] = [
      {
        id: 'data_minimization',
        title: 'Data Minimization',
        description: 'Collect only the data necessary for providing services',
        category: 'privacy',
        enabled: true,
        configurable: false,
        priority: 'high'
      },
      {
        id: 'consent_controls',
        title: 'Granular Consent Controls',
        description: 'Manage how your data is used with detailed consent options',
        category: 'privacy',
        enabled: true,
        configurable: true,
        priority: 'high'
      },
      {
        id: 'data_deletion',
        title: 'Data Deletion Requests',
        description: 'Request deletion of your personal data when no longer needed',
        category: 'privacy',
        enabled: true,
        configurable: false,
        priority: 'medium'
      }
    ];
    
    if (role === 'tenant') {
      return [
        ...baseRecommendations,
        {
          id: 'location_privacy',
          title: 'Location Privacy',
          description: 'Control when and how your location data is collected',
          category: 'privacy',
          enabled: false,
          configurable: true,
          priority: 'medium'
        }
      ];
    } else if (role === 'propertyManager') {
      return [
        ...baseRecommendations,
        {
          id: 'vendor_data_sharing',
          title: 'Vendor Data Sharing Controls',
          description: 'Manage what data is shared with maintenance and service providers',
          category: 'privacy',
          enabled: true,
          configurable: true,
          priority: 'medium'
        },
        {
          id: 'tenant_data_protection',
          title: 'Tenant Data Protection',
          description: 'Enhanced protections for sensitive tenant information',
          category: 'privacy',
          enabled: true,
          configurable: false,
          priority: 'high'
        }
      ];
    } else {
      // Admin role
      return [
        ...baseRecommendations,
        {
          id: 'advanced_audit_logs',
          title: 'Advanced Audit Logging',
          description: 'Comprehensive logging of all data access and modifications',
          category: 'privacy',
          enabled: true,
          configurable: true,
          priority: 'high'
        },
        {
          id: 'data_retention_policies',
          title: 'Data Retention Policies',
          description: 'Configure organization-wide data retention and deletion policies',
          category: 'privacy',
          enabled: true,
          configurable: true,
          priority: 'high'
        }
      ];
    }
  }
};

export default setupWizardService;