/**
 * AI Personalization Dashboard Types
 * Types for personalized recommendations and user preferences
 */

import { AIContent, ConfidenceScore } from './ai';

/**
 * Recommendation category types
 */
export type RecommendationCategoryType = 'local-services' | 'community-events' | 'exclusive-offers';

/**
 * Recommendation item with personalization data
 */
export interface RecommendationItem extends AIContent {
  title: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  ctaUrl: string;
  category: RecommendationCategoryType;
  tags: string[];
  reasoning: string;
  personalizedFor: string; // User ID or criteria
  priority: number;
  expiresAt?: Date;
}

/**
 * Recommendation category with items
 */
export interface RecommendationCategory {
  id: string;
  type: RecommendationCategoryType;
  name: string;
  description: string;
  icon: string;
  items: RecommendationItem[];
  totalItems: number;
  lastUpdated: Date;
}

/**
 * User preferences for personalization
 */
export interface UserPreferences {
  interests: string[];
  location: {
    city: string;
    state: string;
    zipCode: string;
  };
  demographics: {
    ageRange?: string;
    householdSize?: number;
    petOwner?: boolean;
  };
  communicationPreferences: {
    frequency: 'daily' | 'weekly' | 'monthly';
    channels: ('email' | 'push' | 'sms')[];
  };
  privacySettings: {
    allowLocationTracking: boolean;
    allowBehaviorTracking: boolean;
    allowThirdPartyData: boolean;
  };
}

/**
 * Personalization explanation data
 */
export interface PersonalizationExplanation {
  itemId: string;
  reasons: PersonalizationReason[];
  confidence: ConfidenceScore;
  dataPoints: string[];
  privacyNote: string;
}

/**
 * Individual reason for personalization
 */
export interface PersonalizationReason {
  factor: string;
  description: string;
  weight: number;
  dataSource: 'profile' | 'behavior' | 'location' | 'preferences';
}

/**
 * Personalization dashboard state
 */
export interface PersonalizationState {
  categories: RecommendationCategory[];
  userPreferences: UserPreferences;
  explanations: Record<string, PersonalizationExplanation>;
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

/**
 * Props for recommendation card component
 */
export interface RecommendationCardProps {
  item: RecommendationItem;
  onExplanationRequest: (itemId: string) => void;
  onFeedback: (itemId: string, feedback: 'positive' | 'negative', comment?: string) => void;
  onCtaClick: (itemId: string, url: string) => void;
  showPersonalizationLabel?: boolean;
  compact?: boolean;
}

/**
 * Props for recommendation category section
 */
export interface RecommendationCategorySectionProps {
  category: RecommendationCategory;
  onExplanationRequest: (itemId: string) => void;
  onFeedback: (itemId: string, feedback: 'positive' | 'negative', comment?: string) => void;
  onCtaClick: (itemId: string, url: string) => void;
  maxItems?: number;
  showViewAll?: boolean;
}

/**
 * Props for personalization dashboard
 */
export interface PersonalizationDashboardProps {
  userId: string;
  onPreferencesUpdate: (preferences: Partial<UserPreferences>) => void;
  onRefresh: () => void;
  className?: string;
}

/**
 * API response for recommendations
 */
export interface RecommendationsResponse {
  categories: RecommendationCategory[];
  userPreferences: UserPreferences;
  metadata: {
    totalRecommendations: number;
    lastUpdated: Date;
    nextRefresh: Date;
  };
}

/**
 * Feedback submission data
 */
export interface RecommendationFeedback {
  itemId: string;
  userId: string;
  feedback: 'positive' | 'negative';
  comment?: string;
  timestamp: Date;
  context: {
    category: RecommendationCategoryType;
    position: number;
    viewDuration?: number;
  };
}