/**
 * Usage Analytics for Epic 21 Feature Adoption Tracking
 * Advanced Analytics and AI Insights Features
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Filter
} from 'lucide-react';

interface UsageAnalyticsProps {
  feature: 'predictive_maintenance' | 'tenant_churn_prediction' | 'market_trend_integration' | 'ai_powered_reporting' | 'risk_assessment_dashboard' | 'all';
  className?: string;
}

interface UsageMetrics {
  totalUsers: number;
  activeUsers: number;
  featureViews: number;
  interactions: number;
  averageSessionTime: number;
  conversionRate: number;
  userSegments: Array<{
    segment: string;
    userCount: number;
    engagementRate: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
    uniqueUsers: number;
    avgTime: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    users: number;
    interactions: number;
  }>;
}

const UsageAnalytics: React.FC<UsageAnalyticsProps> = ({
  feature = 'all',
  className = ''
}) => {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');

  useEffect(() => {
    loadUsageData();
  }, [feature, timeRange, selectedSegment]);

  const loadUsageData = async () => {
    try {
      setLoading(true);

      // Simulate API call - in real implementation, this would call your analytics service
      const mockData: UsageMetrics = {
        totalUsers: 1250,
        activeUsers: 892,
        featureViews: 15420,
        interactions: 8750,
        averageSessionTime: 8.5,
        conversionRate: 68.2,
        userSegments: [
          { segment: 'Property Managers', userCount: 450, engagementRate: 85.2 },
          { segment: 'Maintenance Staff', userCount: 280, engagementRate: 72.1 },
          { segment: 'Leasing Agents', userCount: 195, engagementRate: 63.8 },
          { segment: 'Investors', userCount: 125, engagementRate: 45.6 },
          { segment: 'Executives', userCount: 75, engagementRate: 38.9 }
        ],
        topPages: [
          { page: '/dashboard/predictive-maintenance', views: 3240, uniqueUsers: 892, avgTime: 12.3 },
          { page: '/dashboard/market-trends', views: 2890, uniqueUsers: 756, avgTime: 8.7 },
          { page: '/dashboard/tenant-churn', views: 2650, uniqueUsers: 634, avgTime: 9.2 },
          { page: '/dashboard/risk-assessment', views: 2380, uniqueUsers: 598, avgTime: 11.5 },
          { page: '/dashboard/ai-reporting', views: 2120, uniqueUsers: 523, avgTime: 7.8 }
        ],
        hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          users: Math.floor(Math.random() * 100) + 20,
          interactions: Math.floor(Math.random() * 200) + 50
        }))
      };

      // Filter data based on selected feature
      if (feature !== 'all') {
        mockData.featureViews = Math.floor(mockData.featureViews * 0.2);
        mockData.interactions = Math.floor(mockData.interactions * 0.2);
        mockData.topPages = mockData.topPages.filter(page =>
          page.page.includes(feature.replace('_', '-'))
        );
      }

      setMetrics(mockData);
    } catch (error) {
      console.error('Error loading usage data:', error);
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
      all: 'All Features'
    };
    return names[feature as keyof typeof names] || feature;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 1) return '< 1m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <Activity className="animate-spin h-6 w-6" />
          <span>Loading usage analytics...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Usage data will appear once users start interacting with the features.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Usage Analytics: {getFeatureDisplayName(feature)}
          </h2>
          <p className="text-gray-600">Track feature adoption and user engagement</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            <option value="property_managers">Property Managers</option>
            <option value="maintenance_staff">Maintenance Staff</option>
            <option value="leasing_agents">Leasing Agents</option>
            <option value="investors">Investors</option>
            <option value="executives">Executives</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.activeUsers)}</p>
              <p className="text-xs text-gray-500">
                {((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1)}% of total users
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Feature Views</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.featureViews)}</p>
              <p className="text-xs text-gray-500">
                {formatNumber(metrics.featureViews / metrics.activeUsers)} per user
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <MousePointer className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Interactions</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.interactions)}</p>
              <p className="text-xs text-gray-500">
                {((metrics.interactions / metrics.featureViews) * 100).toFixed(1)}% engagement rate
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Session</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(metrics.averageSessionTime)}</p>
              <p className="text-xs text-gray-500">
                {metrics.conversionRate.toFixed(1)}% conversion rate
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Segments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">User Segments</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {metrics.userSegments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{segment.segment}</p>
                    <p className="text-sm text-gray-600">{segment.userCount} users</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{segment.engagementRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">engagement</p>
                  </div>
                  <div className="ml-4 w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${segment.engagementRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Pages</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {metrics.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {page.page.replace('/dashboard/', '')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {page.uniqueUsers} unique users
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatNumber(page.views)}</p>
                    <p className="text-xs text-gray-500">{formatTime(page.avgTime)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Activity Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Hourly Activity</h3>
        </div>
        <div className="p-6">
          <div className="flex items-end space-x-2 h-32">
            {metrics.hourlyActivity.map((hour, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="bg-blue-600 rounded-t w-full mb-2"
                  style={{
                    height: `${(hour.users / Math.max(...metrics.hourlyActivity.map(h => h.users))) * 100}%`,
                    minHeight: '4px'
                  }}
                ></div>
                <span className="text-xs text-gray-600">{hour.hour}:00</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Last updated: {new Date().toLocaleString()}</span>
        <div className="flex items-center space-x-4">
          <span>Data refresh: Every 15 minutes</span>
          <button className="text-blue-600 hover:text-blue-800 transition-colors">
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageAnalytics;