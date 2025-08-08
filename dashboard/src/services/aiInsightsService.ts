/**
 * AI Insights Service
 * Service for fetching and managing AI insights data
 */

import { 
  Insight, 
  InsightCategoryGroup, 
  InsightsResponse, 
  InsightFilters, 
  AIRecommendation,
  TimeRange,
  InsightCategory,
  ChartData
} from '../types/ai-insights';
import { apiService } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class AIInsightsService {
  /**
   * Fetch insights with filtering and pagination
   */
  async getInsights(filters?: Partial<InsightFilters>): Promise<InsightsResponse> {
    try {
      const response = await apiService.post('/ai/insights', filters || {});
      return response.data;
    } catch (error) {
      console.error('Error fetching insights:', error);
      throw new Error('Failed to fetch insights');
    }
  }

  /**
   * Get insight by ID
   */
  async getInsightById(id: string): Promise<Insight | null> {
    try {
      const response = await apiService.get(`/ai/insights/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching insight:', error);
      throw new Error('Failed to fetch insight');
    }
  }

  /**
   * Get insights by category
   */
  async getInsightsByCategory(category: InsightCategory): Promise<Insight[]> {
    try {
      const response = await this.getInsights({ categories: [category] });
      return response.insights;
    } catch (error) {
      console.error('Error fetching insights by category:', error);
      throw new Error('Failed to fetch insights by category');
    }
  }

  /**
   * Update recommendation action status
   */
  async updateRecommendationAction(
    insightId: string, 
    recommendationId: string, 
    actionId: string, 
    completed: boolean
  ): Promise<void> {
    try {
      await apiService.put(`/ai/insights/${insightId}/recommendations/${recommendationId}/actions/${actionId}`, {
        completed
      });
    } catch (error) {
      console.error('Error updating recommendation action:', error);
      throw new Error('Failed to update recommendation action');
    }
  }

  /**
   * Submit feedback for insight
   */
  async submitInsightFeedback(insightId: string, feedback: {
    helpful: boolean;
    comment?: string;
    actionTaken?: boolean;
  }): Promise<void> {
    try {
      await apiService.post(`/ai/insights/${insightId}/feedback`, feedback);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  /**
   * Get dashboard summary metrics
   */
  async getDashboardSummary(): Promise<{
    totalInsights: number;
    highPriorityCount: number;
    avgConfidence: number;
    categoryCounts: Record<string, number>;
    lastUpdated: Date;
  }> {
    try {
      const response = await apiService.get('/ai/insights/dashboard-summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw new Error('Failed to fetch dashboard summary');
    }
  }

  /**
   * Get insight categories
   */
  async getInsightCategories(): Promise<InsightCategoryGroup[]> {
    try {
      const response = await apiService.get('/ai/insights/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching insight categories:', error);
      throw new Error('Failed to fetch insight categories');
    }
  }

  /**
   * Get insights timeline
   */
  async getInsightsTimeline(timeRange: TimeRange): Promise<{
    insights: Insight[];
    trends: Array<{
      category: string;
      trend: 'up' | 'down' | 'stable';
      change: number;
    }>;
  }> {
    try {
      const response = await apiService.get(`/ai/insights/timeline?range=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching insights timeline:', error);
      throw new Error('Failed to fetch insights timeline');
    }
  }

  /**
   * Regenerate insight
   */
  async regenerateInsight(insightId: string): Promise<Insight> {
    try {
      const response = await apiService.post(`/ai/insights/${insightId}/regenerate`);
      return response.data;
    } catch (error) {
      console.error('Error regenerating insight:', error);
      throw new Error('Failed to regenerate insight');
    }
  }

  /**
   * Mark insight as read/unread
   */
  async markInsightAsRead(insightId: string, read: boolean): Promise<void> {
    try {
      await apiService.put(`/ai/insights/${insightId}/read`, { read });
    } catch (error) {
      console.error('Error marking insight as read:', error);
      throw new Error('Failed to mark insight as read');
    }
  }

  /**
   * Get AI recommendations based on current insights
   */
  async getAIRecommendations(filters?: {
    category?: string;
    priority?: string;
    limit?: number;
  }): Promise<AIRecommendation[]> {
    try {
      const response = await apiService.post('/ai/recommendations', filters || {});
      return response.data;
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      throw new Error('Failed to fetch AI recommendations');
    }
  }
}

export const aiInsightsService = new AIInsightsService();
export default aiInsightsService;