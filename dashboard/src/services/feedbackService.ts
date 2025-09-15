/**
 * Feedback Service for Epic 21 User Feedback Collection
 * Advanced Analytics and AI Insights Features
 */

import api from './api';

export interface FeedbackSubmission {
  feature: 'predictive_maintenance' | 'tenant_churn_prediction' | 'market_trend_integration' | 'ai_powered_reporting' | 'risk_assessment_dashboard' | 'overall_experience';
  userType: 'property_manager' | 'maintenance_staff' | 'leasing_agent' | 'investor' | 'executive' | 'other';
  feedbackType: 'bug_report' | 'feature_request' | 'usability_feedback' | 'performance_feedback' | 'general_feedback';
  rating: number;
  title: string;
  description: string;
  category: 'accuracy' | 'usability' | 'performance' | 'functionality' | 'design' | 'integration' | 'data_quality' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  url?: string;
}

export interface FeedbackStats {
  period: string;
  feature: string;
  statistics: {
    totalFeedback: number;
    averageRatings: Array<{
      feature: string;
      averageRating: number;
      totalFeedback: number;
    }>;
    statusBreakdown: Array<{
      status: string;
      count: number;
    }>;
    categoryBreakdown: Array<{
      feature: string;
      rating: number;
      category: string;
      priority: string;
      status: string;
      count: number;
    }>;
  };
}

export interface UserFeedback {
  id: string;
  feature: string;
  feedbackType: string;
  rating: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

class FeedbackService {
  private readonly baseUrl = '/api/feedback';

  /**
   * Submit user feedback
   */
  async submitFeedback(feedback: FeedbackSubmission): Promise<{ feedbackId: string; status: string }> {
    try {
      const response = await api.post(`${this.baseUrl}`, feedback);
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback. Please try again.');
    }
  }

  /**
   * Get feedback statistics (admin only)
   */
  async getFeedbackStats(feature?: string, days: number = 30): Promise<FeedbackStats> {
    try {
      const params = new URLSearchParams();
      if (feature) params.append('feature', feature);
      params.append('days', days.toString());

      const response = await api.get(`${this.baseUrl}/stats?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      throw new Error('Failed to fetch feedback statistics.');
    }
  }

  /**
   * Get user's own feedback submissions
   */
  async getUserFeedback(page: number = 1, limit: number = 10, status?: string): Promise<{
    feedbacks: UserFeedback[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) params.append('status', status);

      const response = await api.get(`${this.baseUrl}/my-feedback?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user feedback:', error);
      throw new Error('Failed to fetch your feedback.');
    }
  }

  /**
   * Update feedback status (admin only)
   */
  async updateFeedbackStatus(feedbackId: string, status: string, notes?: string): Promise<{
    id: string;
    status: string;
    updatedAt: string;
  }> {
    try {
      const response = await api.put(`${this.baseUrl}/${feedbackId}/status`, {
        status,
        notes
      });
      return response.data.feedback;
    } catch (error) {
      console.error('Error updating feedback status:', error);
      throw new Error('Failed to update feedback status.');
    }
  }

  /**
   * Export feedback data (admin only)
   */
  async exportFeedback(
    feature?: string,
    startDate?: string,
    endDate?: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (feature) params.append('feature', feature);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('format', format);

      const response = await api.get(`${this.baseUrl}/export?${params}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        // Create download link for CSV
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'epic21-feedback-export.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        return { success: true };
      }

      return response.data;
    } catch (error) {
      console.error('Error exporting feedback:', error);
      throw new Error('Failed to export feedback data.');
    }
  }

  /**
   * Get feedback trends over time
   */
  async getFeedbackTrends(feature?: string, days: number = 30): Promise<{
    trends: Array<{
      date: string;
      totalFeedback: number;
      averageRating: number;
      positiveFeedback: number; // rating >= 4
      negativeFeedback: number; // rating <= 2
    }>;
  }> {
    try {
      const stats = await this.getFeedbackStats(feature, days);

      // Process trends from statistics
      // This would typically involve more complex aggregation
      // For now, return a simplified structure
      const trends = [{
        date: new Date().toISOString().split('T')[0],
        totalFeedback: stats.statistics.totalFeedback,
        averageRating: stats.statistics.averageRatings[0]?.averageRating || 0,
        positiveFeedback: 0, // Would need to calculate from detailed data
        negativeFeedback: 0
      }];

      return { trends };
    } catch (error) {
      console.error('Error fetching feedback trends:', error);
      throw new Error('Failed to fetch feedback trends.');
    }
  }

  /**
   * Get feature-specific feedback insights
   */
  async getFeatureInsights(feature: string): Promise<{
    feature: string;
    averageRating: number;
    totalFeedback: number;
    topCategories: Array<{
      category: string;
      count: number;
      averageRating: number;
    }>;
    commonIssues: string[];
    recentFeedback: UserFeedback[];
  }> {
    try {
      const [stats, recentFeedback] = await Promise.all([
        this.getFeedbackStats(feature, 30),
        this.getUserFeedback(1, 5) // Get recent feedback
      ]);

      const averageRating = stats.statistics.averageRatings[0]?.averageRating || 0;
      const totalFeedback = stats.statistics.totalFeedback;

      // Process top categories
      const categoryStats = stats.statistics.categoryBreakdown.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { count: 0, totalRating: 0 };
        }
        acc[item.category].count += parseInt(item.count);
        acc[item.category].totalRating += item.rating * parseInt(item.count);
        return acc;
      }, {} as Record<string, { count: number; totalRating: number }>);

      const topCategories = Object.entries(categoryStats)
        .map(([category, stats]) => ({
          category,
          count: stats.count,
          averageRating: stats.totalRating / stats.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Extract common issues from recent feedback
      const commonIssues = recentFeedback.feedbacks
        .filter(f => f.rating <= 3)
        .map(f => f.title)
        .slice(0, 3);

      return {
        feature,
        averageRating,
        totalFeedback,
        topCategories,
        commonIssues,
        recentFeedback: recentFeedback.feedbacks
      };
    } catch (error) {
      console.error('Error fetching feature insights:', error);
      throw new Error('Failed to fetch feature insights.');
    }
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService();
export default feedbackService;