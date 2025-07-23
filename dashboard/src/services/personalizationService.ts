/**
 * AI Personalization Service
 * Handles API calls for personalized recommendations
 */

import { 
  RecommendationsResponse, 
  UserPreferences, 
  RecommendationFeedback,
  PersonalizationExplanation 
} from '../types/personalization';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class PersonalizationService {
  private baseUrl = `${API_BASE_URL}/api/personalization`;

  /**
   * Fetch personalized recommendations for a user
   */
  async getRecommendations(userId: string): Promise<RecommendationsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform dates from strings to Date objects
      return {
        ...data,
        categories: data.categories.map((category: any) => ({
          ...category,
          lastUpdated: new Date(category.lastUpdated),
          items: category.items.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
            expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
          })),
        })),
        metadata: {
          ...data.metadata,
          lastUpdated: new Date(data.metadata.lastUpdated),
          nextRefresh: new Date(data.metadata.nextRefresh),
        },
      };
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const response = await fetch(`${this.baseUrl}/preferences/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Submit feedback for a recommendation
   */
  async submitFeedback(feedback: RecommendationFeedback): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...feedback,
          timestamp: feedback.timestamp.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit feedback: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Get explanation for why a recommendation was shown
   */
  async getExplanation(userId: string, itemId: string): Promise<PersonalizationExplanation> {
    try {
      const response = await fetch(`${this.baseUrl}/explanation/${userId}/${itemId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch explanation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching explanation:', error);
      throw error;
    }
  }

  /**
   * Refresh recommendations (trigger re-computation)
   */
  async refreshRecommendations(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh recommendations: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      throw error;
    }
  }

  /**
   * Get mock data for development/demo purposes
   */
  getMockRecommendations(): RecommendationsResponse {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return {
      categories: [
        {
          id: 'local-services',
          type: 'local-services',
          name: 'Local Services',
          description: 'Recommended services near your property',
          icon: 'business',
          totalItems: 8,
          lastUpdated: now,
          items: [
            {
              id: 'service-1',
              title: 'Elite Cleaning Services',
              description: 'Professional cleaning service with 4.8★ rating. Special discount for property residents.',
              content: 'Professional cleaning service recommendation',
              imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
              ctaText: 'Book Now',
              ctaUrl: 'https://elitecleaning.com/book',
              category: 'local-services',
              tags: ['cleaning', 'professional', 'discount'],
              reasoning: 'Based on your recent maintenance requests and neighbor preferences',
              personalizedFor: 'user-123',
              priority: 1,
              confidence: 85,
              timestamp: now,
              explanation: 'Recommended based on your location and similar tenant preferences',
            },
            {
              id: 'service-2',
              title: 'QuickFix Handyman',
              description: 'Reliable handyman service for small repairs. Available same-day.',
              content: 'Handyman service recommendation',
              imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop',
              ctaText: 'Get Quote',
              ctaUrl: 'https://quickfix.com/quote',
              category: 'local-services',
              tags: ['handyman', 'repairs', 'same-day'],
              reasoning: 'Matches your recent search for maintenance services',
              personalizedFor: 'user-123',
              priority: 2,
              confidence: 78,
              timestamp: now,
              explanation: 'Recommended based on your maintenance history',
            },
          ],
        },
        {
          id: 'community-events',
          type: 'community-events',
          name: 'Community Events',
          description: 'Local events and activities you might enjoy',
          icon: 'event',
          totalItems: 5,
          lastUpdated: now,
          items: [
            {
              id: 'event-1',
              title: 'Downtown Farmers Market',
              description: 'Weekly farmers market every Saturday. Fresh produce and local vendors.',
              content: 'Community event recommendation',
              imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop',
              ctaText: 'Learn More',
              ctaUrl: 'https://downtownmarket.com',
              category: 'community-events',
              tags: ['farmers-market', 'weekly', 'local'],
              reasoning: 'Popular with residents in your area who share similar interests',
              personalizedFor: 'user-123',
              priority: 1,
              confidence: 72,
              timestamp: now,
              explanation: 'Recommended based on your interest in local community activities',
              expiresAt: tomorrow,
            },
          ],
        },
        {
          id: 'exclusive-offers',
          type: 'exclusive-offers',
          name: 'Exclusive Offers',
          description: 'Special deals and discounts for residents',
          icon: 'local_offer',
          totalItems: 3,
          lastUpdated: now,
          items: [
            {
              id: 'offer-1',
              title: '20% Off First Month - GreenThumb Landscaping',
              description: 'Professional landscaping services with exclusive resident discount.',
              content: 'Exclusive offer recommendation',
              imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
              ctaText: 'Claim Offer',
              ctaUrl: 'https://greenthumb.com/resident-offer',
              category: 'exclusive-offers',
              tags: ['landscaping', 'discount', '20-percent-off'],
              reasoning: 'Exclusive offer for residents in your building',
              personalizedFor: 'user-123',
              priority: 1,
              confidence: 90,
              timestamp: now,
              explanation: 'Exclusive offer available only to residents in your property',
              expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          ],
        },
      ],
      userPreferences: {
        interests: ['home-improvement', 'local-events', 'professional-services'],
        location: {
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
        },
        demographics: {
          ageRange: '25-34',
          householdSize: 2,
          petOwner: false,
        },
        communicationPreferences: {
          frequency: 'weekly',
          channels: ['email', 'push'],
        },
        privacySettings: {
          allowLocationTracking: true,
          allowBehaviorTracking: true,
          allowThirdPartyData: false,
        },
      },
      metadata: {
        totalRecommendations: 16,
        lastUpdated: now,
        nextRefresh: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours
      },
    };
  }
}

export const personalizationService = new PersonalizationService();
export default PersonalizationService;