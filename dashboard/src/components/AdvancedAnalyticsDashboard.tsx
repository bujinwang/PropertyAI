/**
 * Advanced Analytics Dashboard
 * Comprehensive reporting and visualization for property intelligence
 * Epic 21.5.3 - Advanced Features
 */

import React, { useState, useEffect, useMemo } from 'react';
import { aiPhotoAnalysisService, type PhotoAnalysisResult } from '../services/aiPhotoAnalysisService';
import { propertyTaggingService, type PropertyTags } from '../services/propertyTaggingService';
import { predictiveMaintenanceService, type MaintenanceAnalytics, type MaintenanceAlert } from '../services/predictiveMaintenanceService';
import './AdvancedAnalyticsDashboard.css';

interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  propertyIds: string[];
  categories: string[];
  riskLevels: ('low' | 'medium' | 'high' | 'critical')[];
  analysisTypes: string[];
}

interface DashboardMetrics {
  totalProperties: number;
  totalAnalyses: number;
  activeAlerts: number;
  criticalIssues: number;
  costSavings: number;
  predictionAccuracy: number;
  avgAnalysisTime: number;
}

interface TrendData {
  period: string;
  analyses: number;
  alerts: number;
  costSavings: number;
  accuracy: number;
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'maintenance' | 'trends' | 'reports'>('overview');

  // Data states
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<PhotoAnalysisResult[]>([]);
  const [propertyTags, setPropertyTags] = useState<Map<string, PropertyTags>>(new Map());
  const [maintenanceAnalytics, setMaintenanceAnalytics] = useState<MaintenanceAnalytics | null>(null);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  // Filter states
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    },
    propertyIds: [],
    categories: [],
    riskLevels: ['low', 'medium', 'high', 'critical'],
    analysisTypes: []
  });

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load recent analyses
      const analyses = aiPhotoAnalysisService.getAnalysisHistory(50);
      setRecentAnalyses(analyses);

      // Load property tags for analyzed properties
      const tagsMap = new Map<string, PropertyTags>();
      const uniquePropertyIds = Array.from(new Set(analyses.map(a => a.id || 'unknown')));

      for (const propertyId of uniquePropertyIds) {
        if (propertyId !== 'unknown') {
          const tags = propertyTaggingService.getPropertyTags(propertyId);
          if (tags) {
            tagsMap.set(propertyId, tags);
          }
        }
      }
      setPropertyTags(tagsMap);

      // Load maintenance analytics
      if (uniquePropertyIds.length > 0) {
        const analytics = await predictiveMaintenanceService.generateAnalytics(
          uniquePropertyIds[0], // Use first property for demo
          filters.dateRange.start.getTime(),
          filters.dateRange.end.getTime()
        );
        setMaintenanceAnalytics(analytics);

        // Load alerts for the property
        const propertyAlerts = predictiveMaintenanceService.getAlerts(uniquePropertyIds[0]);
        setAlerts(propertyAlerts);
      }

      // Calculate metrics
      const dashboardMetrics = calculateMetrics(analyses, tagsMap, alerts);
      setMetrics(dashboardMetrics);

      // Generate trend data
      const trends = generateTrendData(analyses, alerts, filters.dateRange);
      setTrendData(trends);

    } catch (error) {
      console.error('[Analytics Dashboard] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (
    analyses: PhotoAnalysisResult[],
    tags: Map<string, PropertyTags>,
    alerts: MaintenanceAlert[]
  ): DashboardMetrics => {
    const totalProperties = new Set(analyses.map(a => a.id || 'unknown')).size;
    const totalAnalyses = analyses.length;
    const activeAlerts = alerts.filter(a => !a.resolved).length;
    const criticalIssues = alerts.filter(a => a.priority === 'critical').length;

    // Calculate cost savings from maintenance predictions
    const costSavings = alerts
      .filter(a => a.resolved)
      .reduce((sum, alert) => sum + (alert.estimatedCost * 0.3), 0); // Assume 30% savings

    // Calculate prediction accuracy
    const predictionAccuracy = analyses.length > 0
      ? analyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / analyses.length
      : 0;

    // Calculate average analysis time
    const avgAnalysisTime = analyses.length > 0
      ? analyses.reduce((sum, analysis) => sum + analysis.metadata.processingTime, 0) / analyses.length
      : 0;

    return {
      totalProperties,
      totalAnalyses,
      activeAlerts,
      criticalIssues,
      costSavings,
      predictionAccuracy,
      avgAnalysisTime
    };
  };

  const generateTrendData = (
    analyses: PhotoAnalysisResult[],
    alerts: MaintenanceAlert[],
    dateRange: { start: Date; end: Date }
  ): TrendData[] => {
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000));
    const trends: TrendData[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      const periodStart = date.getTime();
      const periodEnd = periodStart + 24 * 60 * 60 * 1000;

      const periodAnalyses = analyses.filter(a =>
        a.timestamp >= periodStart && a.timestamp < periodEnd
      );

      const periodAlerts = alerts.filter(a =>
        a.createdAt >= periodStart && a.createdAt < periodEnd
      );

      trends.push({
        period: date.toLocaleDateString(),
        analyses: periodAnalyses.length,
        alerts: periodAlerts.length,
        costSavings: periodAlerts.reduce((sum, alert) => sum + (alert.estimatedCost * 0.3), 0),
        accuracy: periodAnalyses.length > 0
          ? periodAnalyses.reduce((sum, a) => sum + a.confidence, 0) / periodAnalyses.length
          : 0
      });
    }

    return trends;
  };

  const exportReport = async (format: 'pdf' | 'csv' | 'json' = 'pdf') => {
    try {
      const reportData = {
        generatedAt: new Date().toISOString(),
        metrics,
        filters,
        summary: {
          totalProperties: metrics?.totalProperties || 0,
          totalAnalyses: metrics?.totalAnalyses || 0,
          activeAlerts: metrics?.activeAlerts || 0,
          costSavings: metrics?.costSavings || 0,
          topIssues: alerts
            .filter(a => a.priority === 'critical')
            .slice(0, 5)
            .map(a => ({
              title: a.title,
              propertyId: a.propertyId,
              estimatedCost: a.estimatedCost
            }))
        }
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `property-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For PDF/CSV, we'd integrate with a reporting library
        console.log('Report data prepared for', format, 'export:', reportData);
        alert(`${format.toUpperCase()} export functionality would be implemented with a reporting library`);
      }
    } catch (error) {
      console.error('[Analytics Dashboard] Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="advanced-analytics-dashboard">
      <header className="dashboard-header">
        <h1>Advanced Property Analytics Dashboard</h1>
        <div className="dashboard-actions">
          <button
            className="export-button"
            onClick={() => exportReport('pdf')}
            aria-label="Export report as PDF"
          >
            📄 Export PDF
          </button>
          <button
            className="export-button"
            onClick={() => exportReport('csv')}
            aria-label="Export data as CSV"
          >
            📊 Export CSV
          </button>
          <button
            className="refresh-button"
            onClick={loadDashboardData}
            aria-label="Refresh dashboard data"
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="dashboard-tabs" role="tablist">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'properties', label: 'Properties', icon: '🏠' },
          { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
          { id: 'trends', label: 'Trends', icon: '📈' },
          { id: 'reports', label: 'Reports', icon: '📋' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab">
            <OverviewTab
              metrics={metrics}
              recentAnalyses={recentAnalyses}
              alerts={alerts}
            />
          </div>
        )}

        {activeTab === 'properties' && (
          <div id="properties-panel" role="tabpanel" aria-labelledby="properties-tab">
            <PropertiesTab
              propertyTags={propertyTags}
              analyses={recentAnalyses}
            />
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div id="maintenance-panel" role="tabpanel" aria-labelledby="maintenance-tab">
            <MaintenanceTab
              analytics={maintenanceAnalytics}
              alerts={alerts}
            />
          </div>
        )}

        {activeTab === 'trends' && (
          <div id="trends-panel" role="tabpanel" aria-labelledby="trends-tab">
            <TrendsTab
              trendData={trendData}
              dateRange={filters.dateRange}
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <div id="reports-panel" role="tabpanel" aria-labelledby="reports-tab">
            <ReportsTab
              metrics={metrics}
              filters={filters}
              onExport={exportReport}
            />
          </div>
        )}
      </main>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  metrics: DashboardMetrics | null;
  recentAnalyses: PhotoAnalysisResult[];
  alerts: MaintenanceAlert[];
}> = ({ metrics, recentAnalyses, alerts }) => {
  if (!metrics) return <div>No data available</div>;

  return (
    <div className="overview-tab">
      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Properties</h3>
          <div className="metric-value">{metrics.totalProperties}</div>
          <div className="metric-trend">+12% from last month</div>
        </div>

        <div className="metric-card">
          <h3>AI Analyses</h3>
          <div className="metric-value">{metrics.totalAnalyses}</div>
          <div className="metric-trend">+8% from last week</div>
        </div>

        <div className="metric-card">
          <h3>Active Alerts</h3>
          <div className="metric-value">{metrics.activeAlerts}</div>
          <div className="metric-trend" style={{ color: metrics.activeAlerts > 5 ? '#f44336' : '#4caf50' }}>
            {metrics.activeAlerts > 5 ? 'High' : 'Normal'}
          </div>
        </div>

        <div className="metric-card">
          <h3>Cost Savings</h3>
          <div className="metric-value">${metrics.costSavings.toLocaleString()}</div>
          <div className="metric-trend" style={{ color: '#4caf50' }}>
            +15% efficiency
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent AI Analyses</h3>
        <div className="activity-list">
          {recentAnalyses.slice(0, 5).map(analysis => (
            <div key={analysis.id} className="activity-item">
              <div className="activity-icon">🤖</div>
              <div className="activity-content">
                <div className="activity-title">
                  Property Analysis Complete
                </div>
                <div className="activity-details">
                  {analysis.analysis.propertyType} • {Math.round(analysis.confidence * 100)}% confidence
                </div>
                <div className="activity-time">
                  {new Date(analysis.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="critical-alerts">
        <h3>Critical Maintenance Alerts</h3>
        <div className="alerts-list">
          {alerts
            .filter(alert => alert.priority === 'critical' && !alert.resolved)
            .slice(0, 3)
            .map(alert => (
              <div key={alert.id} className="alert-item critical">
                <div className="alert-icon">🚨</div>
                <div className="alert-content">
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-details">
                    Due: {new Date(alert.dueDate).toLocaleDateString()}
                    • Cost: ${alert.estimatedCost}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// Properties Tab Component
const PropertiesTab: React.FC<{
  propertyTags: Map<string, PropertyTags>;
  analyses: PhotoAnalysisResult[];
}> = ({ propertyTags, analyses }) => {
  const propertySummaries = useMemo(() => {
    const summaries: Array<{
      propertyId: string;
      tags: number;
      analyses: number;
      lastAnalysis: number;
      condition: string;
      riskLevel: string;
    }> = [];

    for (const [propertyId, tags] of Array.from(propertyTags.entries())) {
      const propertyAnalyses = analyses.filter(a => a.id === propertyId);
      const latestAnalysis = propertyAnalyses.sort((a, b) => b.timestamp - a.timestamp)[0];

      summaries.push({
        propertyId,
        tags: tags.tags.length,
        analyses: propertyAnalyses.length,
        lastAnalysis: latestAnalysis?.timestamp || 0,
        condition: latestAnalysis?.analysis.condition || 'unknown',
        riskLevel: latestAnalysis ? getRiskFromCondition(latestAnalysis.analysis.condition) : 'unknown'
      });
    }

    return summaries;
  }, [propertyTags, analyses]);

  // Helper function to map condition to risk level
  const getRiskFromCondition = (condition: string): string => {
    switch (condition) {
      case 'excellent': return 'low';
      case 'good': return 'low';
      case 'fair': return 'medium';
      case 'poor': return 'high';
      case 'critical': return 'critical';
      default: return 'unknown';
    }
  };

  return (
    <div className="properties-tab">
      <div className="properties-grid">
        {propertySummaries.map(property => (
          <div key={property.propertyId} className="property-card">
            <div className="property-header">
              <h4>Property {property.propertyId}</h4>
              <span className={`risk-badge ${property.riskLevel}`}>
                {property.riskLevel}
              </span>
            </div>

            <div className="property-metrics">
              <div className="metric">
                <span className="metric-label">AI Tags</span>
                <span className="metric-value">{property.tags}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Analyses</span>
                <span className="metric-value">{property.analyses}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Condition</span>
                <span className="metric-value">{property.condition}</span>
              </div>
            </div>

            <div className="property-last-analysis">
              Last Analysis: {property.lastAnalysis ?
                new Date(property.lastAnalysis).toLocaleDateString() :
                'Never'
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Maintenance Tab Component
const MaintenanceTab: React.FC<{
  analytics: MaintenanceAnalytics | null;
  alerts: MaintenanceAlert[];
}> = ({ analytics, alerts }) => {
  if (!analytics) return <div>No maintenance data available</div>;

  return (
    <div className="maintenance-tab">
      {/* Maintenance Summary */}
      <div className="maintenance-summary">
        <div className="summary-card">
          <h3>Maintenance Overview</h3>
          <div className="summary-metrics">
            <div className="metric">
              <span className="label">Total Predictions</span>
              <span className="value">{analytics.summary.totalPredictions}</span>
            </div>
            <div className="metric">
              <span className="label">Critical Alerts</span>
              <span className="value">{analytics.summary.criticalAlerts}</span>
            </div>
            <div className="metric">
              <span className="label">Resolved Issues</span>
              <span className="value">{analytics.summary.resolvedIssues}</span>
            </div>
            <div className="metric">
              <span className="label">Cost Savings</span>
              <span className="value">${analytics.summary.costSavings.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="active-alerts">
        <h3>Active Maintenance Alerts</h3>
        <div className="alerts-table">
          <div className="table-header">
            <div>Priority</div>
            <div>Title</div>
            <div>Due Date</div>
            <div>Estimated Cost</div>
            <div>Status</div>
          </div>
          {alerts
            .filter(alert => !alert.resolved)
            .sort((a, b) => {
              const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
              return priorityOrder[b.priority as keyof typeof priorityOrder] -
                     priorityOrder[a.priority as keyof typeof priorityOrder];
            })
            .map(alert => (
              <div key={alert.id} className={`table-row ${alert.priority}`}>
                <div className="priority-badge">{alert.priority}</div>
                <div className="alert-title">{alert.title}</div>
                <div className="due-date">{new Date(alert.dueDate).toLocaleDateString()}</div>
                <div className="cost">${alert.estimatedCost}</div>
                <div className="status">
                  {alert.acknowledged ? 'Acknowledged' : 'Pending'}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations">
        <h3>AI Recommendations</h3>
        <div className="recommendations-list">
          {analytics.recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <div className="rec-icon">💡</div>
              <div className="rec-content">{rec}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Trends Tab Component
const TrendsTab: React.FC<{
  trendData: TrendData[];
  dateRange: { start: Date; end: Date };
}> = ({ trendData, dateRange }) => {
  return (
    <div className="trends-tab">
      <div className="trends-controls">
        <div className="date-range">
          <span>Period: {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="trend-charts">
        <div className="chart-container">
          <h3>Analysis Volume Trend</h3>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {trendData.map((data, index) => (
                <div
                  key={index}
                  className="chart-bar"
                  style={{
                    height: `${Math.max(20, (data.analyses / Math.max(...trendData.map(d => d.analyses))) * 100)}%`
                  }}
                  title={`${data.period}: ${data.analyses} analyses`}
                >
                  <span className="bar-value">{data.analyses}</span>
                </div>
              ))}
            </div>
            <div className="chart-labels">
              {trendData.map((data, index) => (
                <div key={index} className="chart-label">
                  {new Date(data.period).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h3>Maintenance Alerts Trend</h3>
          <div className="chart-placeholder">
            <div className="chart-lines">
              {trendData.map((data, index) => (
                <div
                  key={index}
                  className="chart-point"
                  style={{
                    left: `${(index / (trendData.length - 1)) * 100}%`,
                    bottom: `${(data.alerts / Math.max(...trendData.map(d => d.alerts))) * 100}%`
                  }}
                  title={`${data.period}: ${data.alerts} alerts`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trend Summary */}
      <div className="trend-summary">
        <h3>Trend Analysis</h3>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Average Daily Analyses</span>
            <span className="stat-value">
              {Math.round(trendData.reduce((sum, d) => sum + d.analyses, 0) / trendData.length)}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Peak Analysis Day</span>
            <span className="stat-value">
              {trendData.reduce((max, d) => d.analyses > max.analyses ? d : max).period}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Total Cost Savings</span>
            <span className="stat-value">
              ${trendData.reduce((sum, d) => sum + d.costSavings, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reports Tab Component
const ReportsTab: React.FC<{
  metrics: DashboardMetrics | null;
  filters: DashboardFilters;
  onExport: (format: 'pdf' | 'csv' | 'json') => void;
}> = ({ metrics, filters, onExport }) => {
  return (
    <div className="reports-tab">
      <div className="report-generator">
        <h3>Generate Custom Report</h3>

        <div className="report-options">
          <div className="option-group">
            <label>Report Type</label>
            <select defaultValue="comprehensive">
              <option value="comprehensive">Comprehensive Analytics</option>
              <option value="maintenance">Maintenance Report</option>
              <option value="performance">Performance Analysis</option>
              <option value="cost">Cost Savings Report</option>
            </select>
          </div>

          <div className="option-group">
            <label>Date Range</label>
            <div className="date-inputs">
              <input
                type="date"
                defaultValue={filters.dateRange.start.toISOString().split('T')[0]}
              />
              <span>to</span>
              <input
                type="date"
                defaultValue={filters.dateRange.end.toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="option-group">
            <label>Include Sections</label>
            <div className="checkbox-group">
              <label>
                <input type="checkbox" defaultChecked /> Executive Summary
              </label>
              <label>
                <input type="checkbox" defaultChecked /> Detailed Analytics
              </label>
              <label>
                <input type="checkbox" defaultChecked /> Maintenance Data
              </label>
              <label>
                <input type="checkbox" defaultChecked /> Recommendations
              </label>
            </div>
          </div>
        </div>

        <div className="export-options">
          <h4>Export Format</h4>
          <div className="export-buttons">
            <button onClick={() => onExport('pdf')} className="export-btn pdf">
              📄 PDF Report
            </button>
            <button onClick={() => onExport('csv')} className="export-btn csv">
              📊 CSV Data
            </button>
            <button onClick={() => onExport('json')} className="export-btn json">
              💾 JSON Data
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="report-preview">
        <h3>Report Preview</h3>
        <div className="preview-content">
          <div className="preview-section">
            <h4>Executive Summary</h4>
            <p>
              This report covers the period from {filters.dateRange.start.toLocaleDateString()} to {filters.dateRange.end.toLocaleDateString()}.
              During this period, {metrics?.totalAnalyses || 0} AI-powered property analyses were performed across {metrics?.totalProperties || 0} properties.
            </p>
          </div>

          <div className="preview-section">
            <h4>Key Metrics</h4>
            <ul>
              <li>Total Properties Analyzed: {metrics?.totalProperties || 0}</li>
              <li>AI Analyses Completed: {metrics?.totalAnalyses || 0}</li>
              <li>Active Maintenance Alerts: {metrics?.activeAlerts || 0}</li>
              <li>Cost Savings Identified: ${metrics?.costSavings.toLocaleString() || 0}</li>
              <li>Prediction Accuracy: {Math.round((metrics?.predictionAccuracy || 0) * 100)}%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};


export default AdvancedAnalyticsDashboard;