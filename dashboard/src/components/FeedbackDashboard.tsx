/**
 * Feedback Dashboard for Epic 21 User Feedback Management
 * Advanced Analytics and AI Insights Features
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { feedbackService, FeedbackStats, UserFeedback } from '../services/feedbackService';

interface FeedbackDashboardProps {
  className?: string;
}

interface FeedbackMetrics {
  totalFeedback: number;
  averageRating: number;
  responseRate: number;
  topIssues: Array<{
    title: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
}

const FeedbackDashboard: React.FC<FeedbackDashboardProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<number>(30);

  useEffect(() => {
    loadFeedbackData();
  }, [selectedFeature, timeRange]);

  const loadFeedbackData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, feedbackData] = await Promise.all([
        feedbackService.getFeedbackStats(
          selectedFeature === 'all' ? undefined : selectedFeature,
          timeRange
        ),
        feedbackService.getUserFeedback(1, 10)
      ]);

      setStats(statsData);
      setRecentFeedback(feedbackData.feedbacks);
    } catch (err) {
      setError('Failed to load feedback data');
      console.error('Error loading feedback data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFeatureDisplayName = (feature: string) => {
    const names = {
      predictive_maintenance: 'Predictive Maintenance',
      tenant_churn_prediction: 'Tenant Churn Prediction',
      market_trend_integration: 'Market Trend Integration',
      ai_powered_reporting: 'AI-Powered Reporting',
      risk_assessment_dashboard: 'Risk Assessment Dashboard',
      overall_experience: 'Overall Experience'
    };
    return names[feature as keyof typeof names] || feature;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'in_review': return 'bg-purple-100 text-purple-800';
      case 'addressed': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateMetrics = (): FeedbackMetrics => {
    if (!stats) return {
      totalFeedback: 0,
      averageRating: 0,
      responseRate: 0,
      topIssues: []
    };

    const totalFeedback = stats.statistics.totalFeedback;
    const averageRating = stats.statistics.averageRatings[0]?.averageRating || 0;

    // Calculate response rate (acknowledged + addressed + closed)
    const respondedCount = stats.statistics.statusBreakdown.reduce((sum, status) => {
      if (['acknowledged', 'in_review', 'addressed', 'closed'].includes(status.status)) {
        return sum + parseInt(status.count);
      }
      return sum;
    }, 0);

    const responseRate = totalFeedback > 0 ? (respondedCount / totalFeedback) * 100 : 0;

    // Calculate top issues from categories
    const topIssues = stats.statistics.categoryBreakdown
      .filter(item => item.rating <= 3) // Focus on low-rated feedback
      .sort((a, b) => parseInt(b.count) - parseInt(a.count))
      .slice(0, 5)
      .map(item => ({
        title: item.category,
        count: parseInt(item.count),
        severity: item.rating <= 2 ? 'high' : 'medium' as 'low' | 'medium' | 'high'
      }));

    return {
      totalFeedback,
      averageRating,
      responseRate,
      topIssues
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <RefreshCw className="animate-spin h-6 w-6" />
          <span>Loading feedback data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Feedback</h3>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={loadFeedbackData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Epic 21 Feedback Dashboard</h2>
          <p className="text-gray-600">Monitor user feedback and feature adoption</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedFeature}
            onChange={(e) => setSelectedFeature(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Features</option>
            <option value="predictive_maintenance">Predictive Maintenance</option>
            <option value="tenant_churn_prediction">Tenant Churn Prediction</option>
            <option value="market_trend_integration">Market Trend Integration</option>
            <option value="ai_powered_reporting">AI-Powered Reporting</option>
            <option value="risk_assessment_dashboard">Risk Assessment Dashboard</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={loadFeedbackData}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalFeedback}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className={`text-2xl font-bold ${getRatingColor(metrics.averageRating)}`}>
                {metrics.averageRating.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.responseRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Issues</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.topIssues.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Feedback */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Feedback</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recentFeedback.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No feedback submissions yet
              </div>
            ) : (
              recentFeedback.map((feedback) => (
                <div key={feedback.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{feedback.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(feedback.status)}`}>
                          {feedback.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feedback.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{getFeatureDisplayName(feedback.feature)}</span>
                        <span>Rating: {feedback.rating}/5</span>
                        <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Issues */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Issues</h3>
          </div>
          <div className="p-6">
            {metrics.topIssues.length === 0 ? (
              <div className="text-center text-gray-500">
                No significant issues identified
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.topIssues.map((issue, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">{issue.title}</p>
                      <p className="text-sm text-gray-600">{issue.count} reports</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                      issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Last updated: {new Date().toLocaleString()}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => feedbackService.exportFeedback(selectedFeature === 'all' ? undefined : selectedFeature)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            <span>Export Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDashboard;