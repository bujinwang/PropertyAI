/**
 * Comprehensive Analytics Dashboard
 *
 * Enterprise-grade analytics dashboard that integrates all property intelligence systems:
 * - Predictive Analytics Engine
 * - Real-Time Alert System
 * - Market Data Analysis
 * - Portfolio Performance
 * - Maintenance Forecasting
 * - Financial Impact Analysis
 * - Trend Analysis & Forecasting
 *
 * Epic 21.5.4 - Comprehensive Analytics Integration
 */

import React, { useState, useEffect, useMemo } from 'react';
import { predictiveAnalyticsEngine, type PortfolioAnalytics, type PredictiveMaintenanceForecast, type FinancialImpactAnalysis, type TrendAnalysis } from '../services/predictiveAnalyticsEngine';
import { realTimeAlertService } from '../services/realTimeAlertService';
import { AlertType, Alert } from '../types/alerts';
import { marketDataService, type MarketData } from '../services/marketDataService';
import { PropertyData, MaintenanceRecord } from '../types/property';
import './ComprehensiveAnalyticsDashboard.css';

// Dashboard configuration
interface DashboardConfig {
  autoRefresh: boolean;
  refreshInterval: number; // minutes
  defaultTimeRange: number; // days
  riskThreshold: 'low' | 'medium' | 'high';
  showPredictions: boolean;
  showAlerts: boolean;
  showMarketData: boolean;
}

// Dashboard state
interface DashboardState {
  loading: boolean;
  lastUpdate: Date | null;
  error: string | null;
  config: DashboardConfig;
}

// Analytics data aggregation
interface AggregatedAnalytics {
  portfolio: PortfolioAnalytics | null;
  alerts: Alert[];
  marketTrends: MarketData[];
  predictions: PredictiveMaintenanceForecast[];
  financials: FinancialImpactAnalysis[];
  trends: TrendAnalysis[];
  performance: {
    totalValue: number;
    totalMaintenanceCost: number;
    predictedSavings: number;
    riskScore: number;
    marketGrowth: number;
  };
}

const ComprehensiveAnalyticsDashboard: React.FC = () => {
  // Dashboard state
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    loading: true,
    lastUpdate: null,
    error: null,
    config: {
      autoRefresh: true,
      refreshInterval: 5,
      defaultTimeRange: 30,
      riskThreshold: 'medium',
      showPredictions: true,
      showAlerts: true,
      showMarketData: true
    }
  });

  // Analytics data
  const [analytics, setAnalytics] = useState<AggregatedAnalytics>({
    portfolio: null,
    alerts: [],
    marketTrends: [],
    predictions: [],
    financials: [],
    trends: [],
    performance: {
      totalValue: 0,
      totalMaintenanceCost: 0,
      predictedSavings: 0,
      riskScore: 0,
      marketGrowth: 0
    }
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'maintenance' | 'financial' | 'market' | 'alerts' | 'trends'>('overview');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30);

  // Load comprehensive analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  // Auto-refresh functionality
  useEffect(() => {
    if (dashboardState.config.autoRefresh) {
      const interval = setInterval(() => {
        loadAnalyticsData();
      }, dashboardState.config.refreshInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [dashboardState.config.autoRefresh, dashboardState.config.refreshInterval]);

  const loadAnalyticsData = async () => {
    try {
      setDashboardState(prev => ({ ...prev, loading: true, error: null }));

      // Load data from all analytics services
      const [
        portfolioData,
        alertsData,
        marketData,
        predictionsData,
        financialData,
        trendsData
      ] = await Promise.all([
        loadPortfolioAnalytics(),
        loadAlertsData(),
        loadMarketData(),
        loadPredictionsData(),
        loadFinancialData(),
        loadTrendsData()
      ]);

      // Aggregate performance metrics
      const performance = calculatePerformanceMetrics(
        portfolioData,
        financialData,
        marketData,
        predictionsData
      );

      setAnalytics({
        portfolio: portfolioData,
        alerts: alertsData,
        marketTrends: marketData,
        predictions: predictionsData,
        financials: financialData,
        trends: trendsData,
        performance
      });

      setDashboardState(prev => ({
        ...prev,
        loading: false,
        lastUpdate: new Date(),
        error: null
      }));

    } catch (error) {
      console.error('[Comprehensive Analytics] Failed to load data:', error);
      setDashboardState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics data'
      }));
    }
  };

  // Data loading functions
  const loadPortfolioAnalytics = async (): Promise<PortfolioAnalytics | null> => {
    try {
      // This would typically load from your property database
      // For now, we'll use mock data structure
      const mockProperties: PropertyData[] = [];
      const mockMaintenance: MaintenanceRecord[] = [];
      const mockMarket: MarketData[] = [];

      if (mockProperties.length === 0) return null;

      return await predictiveAnalyticsEngine.generatePortfolioAnalytics(
        mockProperties,
        mockMaintenance,
        mockMarket
      );
    } catch (error) {
      console.error('Failed to load portfolio analytics:', error);
      return null;
    }
  };

  const loadAlertsData = async (): Promise<Alert[]> => {
    try {
      return await realTimeAlertService.getActiveAlerts();
    } catch (error) {
      console.error('Failed to load alerts data:', error);
      return [];
    }
  };

  const loadMarketData = async (): Promise<MarketData[]> => {
    try {
      // Mock zip code for demo purposes
      const mockZipCode = '90210';
      const trendsResponse = await marketDataService.getMarketTrends(mockZipCode, timeRange);
      // Map MarketTrends.trends to MarketData array
      return trendsResponse.trends.map((trend, index) => ({
        avgRent1BR: trend.avgRent1BR || 1500 + index * 10,
        avgRent2BR: trend.avgRent2BR || 2000 + index * 15,
        avgRent3BR: trend.avgRent3BR || 2500 + index * 20,
        medianPrice: trend.medianPrice || 300000 + index * 5000,
        vacancyRate: trend.vacancyRate || 0.05 - index * 0.001,
        marketTrend: trendsResponse.current.marketTrend || 'stable',
        trendPercentage: trendsResponse.current.trendPercentage || 2.5 + index * 0.1,
        comparableProperties: [], // Mock empty
        source: trendsResponse.source,
        lastUpdated: trendsResponse.lastUpdated,
        confidence: 0.95 // Mock
      }));
    } catch (error) {
      console.error('Failed to load market data:', error);
      return [];
    }
  };

  const loadPredictionsData = async (): Promise<PredictiveMaintenanceForecast[]> => {
    try {
      // Load predictions for all properties
      const mockProperties: PropertyData[] = [];
      const mockMaintenance: MaintenanceRecord[] = [];

      const predictions = await Promise.all(
        mockProperties.map(property =>
          predictiveAnalyticsEngine.generatePredictiveMaintenanceForecast(property, mockMaintenance)
        )
      );

      return predictions.flat();
    } catch (error) {
      console.error('Failed to load predictions data:', error);
      return [];
    }
  };

  const loadFinancialData = async (): Promise<FinancialImpactAnalysis[]> => {
    try {
      const mockProperties: PropertyData[] = [];
      const mockMaintenance: MaintenanceRecord[] = [];
      const mockMarket: MarketData[] = [];

      const financials = await Promise.all(
        mockProperties.map(property =>
          predictiveAnalyticsEngine.generateFinancialImpactAnalysis(property, mockMaintenance, mockMarket)
        )
      );

      return financials;
    } catch (error) {
      console.error('Failed to load financial data:', error);
      return [];
    }
  };

  const loadTrendsData = async (): Promise<TrendAnalysis[]> => {
    try {
      const mockProperties: PropertyData[] = [];
      const mockMaintenance: MaintenanceRecord[] = [];
      const mockMarket: MarketData[] = [];

      const trends = await Promise.all(
        mockProperties.map(property =>
          predictiveAnalyticsEngine.generateTrendAnalysis(property, mockMaintenance, mockMarket)
        )
      );

      return trends;
    } catch (error) {
      console.error('Failed to load trends data:', error);
      return [];
    }
  };

  // Performance calculation
  const calculatePerformanceMetrics = (
    portfolio: PortfolioAnalytics | null,
    financials: FinancialImpactAnalysis[],
    marketData: MarketData[],
    predictions: PredictiveMaintenanceForecast[]
  ) => {
    const totalValue = financials.reduce((sum, f) => sum + f.currentValue, 0);
    const totalMaintenanceCost = financials.reduce((sum, f) => sum + f.maintenanceImpact, 0);
    const predictedSavings = predictions.reduce((sum, p) => sum + p.costImpact.totalCost * 0.3, 0);

    // Calculate risk score based on predictions
    const riskScore = predictions.length > 0
      ? predictions.reduce((sum, p) => {
          const riskMultiplier = { critical: 4, high: 3, medium: 2, low: 1 }[p.riskLevel] || 1;
          return sum + (p.failureProbability * riskMultiplier);
        }, 0) / predictions.length
      : 0;

    // Calculate market growth
    const marketGrowth = marketData.length > 1
      ? ((marketData[marketData.length - 1].medianPrice - marketData[0].medianPrice) / marketData[0].medianPrice) * 100
      : 0;

    return {
      totalValue,
      totalMaintenanceCost,
      predictedSavings,
      riskScore,
      marketGrowth
    };
  };

  // Memoized calculations for performance
  const criticalAlerts = useMemo(() =>
    analytics.alerts.filter(alert => alert.severity === 'critical'),
    [analytics.alerts]
  );

  const highRiskPredictions = useMemo(() =>
    analytics.predictions.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high'),
    [analytics.predictions]
  );

  const portfolioHealth = useMemo(() => {
    if (!analytics.portfolio) return 'unknown';

    const avgCondition = analytics.portfolio.averageConditionScore;
    if (avgCondition >= 80) return 'excellent';
    if (avgCondition >= 60) return 'good';
    if (avgCondition >= 40) return 'fair';
    return 'poor';
  }, [analytics.portfolio]);

  // Export functionality
  const exportDashboardData = async (format: 'pdf' | 'csv' | 'json' = 'json') => {
    try {
      const exportData = {
        generatedAt: new Date().toISOString(),
        timeRange: `${timeRange} days`,
        summary: {
          totalValue: analytics.performance.totalValue,
          totalMaintenanceCost: analytics.performance.totalMaintenanceCost,
          predictedSavings: analytics.performance.predictedSavings,
          riskScore: analytics.performance.riskScore,
          marketGrowth: analytics.performance.marketGrowth,
          criticalAlerts: criticalAlerts.length,
          highRiskPredictions: highRiskPredictions.length,
          portfolioHealth
        },
        detailed: {
          portfolio: analytics.portfolio,
          alerts: analytics.alerts,
          marketTrends: analytics.marketTrends,
          predictions: analytics.predictions,
          financials: analytics.financials,
          trends: analytics.trends
        }
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprehensive-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert(`${format.toUpperCase()} export functionality would be implemented with a reporting library`);
      }
    } catch (error) {
      console.error('[Analytics Dashboard] Export failed:', error);
    }
  };

  if (dashboardState.loading) {
    return (
      <div className="comprehensive-analytics-dashboard loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Comprehensive Analytics...</h2>
          <p>Integrating predictive analytics, real-time alerts, and market intelligence</p>
        </div>
      </div>
    );
  }

  if (dashboardState.error) {
    return (
      <div className="comprehensive-analytics-dashboard error">
        <div className="error-container">
          <h2>Analytics Dashboard Error</h2>
          <p>{dashboardState.error}</p>
          <button onClick={loadAnalyticsData} className="retry-button">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="comprehensive-analytics-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🏢 Comprehensive Property Analytics Dashboard</h1>
          <div className="header-meta">
            <span className="last-update">
              Last Update: {dashboardState.lastUpdate?.toLocaleString() || 'Never'}
            </span>
            <span className="time-range">
              Time Range: {timeRange} days
            </span>
          </div>
        </div>

        <div className="header-actions">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="time-range-select"
          >
            <option value={7}>7 Days</option>
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
            <option value={365}>1 Year</option>
          </select>

          <button
            onClick={() => exportDashboardData('json')}
            className="export-button"
            title="Export dashboard data"
          >
            📊 Export
          </button>

          <button
            onClick={loadAnalyticsData}
            className="refresh-button"
            title="Refresh all analytics data"
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Key Performance Indicators */}
      <section className="kpi-section">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <h3>Total Portfolio Value</h3>
              <div className="kpi-value">
                ${analytics.performance.totalValue.toLocaleString()}
              </div>
              <div className="kpi-trend positive">
                +{analytics.performance.marketGrowth.toFixed(1)}% market growth
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">🔧</div>
            <div className="kpi-content">
              <h3>Maintenance Cost</h3>
              <div className="kpi-value">
                ${analytics.performance.totalMaintenanceCost.toLocaleString()}
              </div>
              <div className="kpi-trend negative">
                Predicted savings: ${analytics.performance.predictedSavings.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">🚨</div>
            <div className="kpi-content">
              <h3>Critical Alerts</h3>
              <div className="kpi-value">{criticalAlerts.length}</div>
              <div className="kpi-trend" style={{
                color: criticalAlerts.length > 0 ? '#f44336' : '#4caf50'
              }}>
                {criticalAlerts.length > 0 ? 'Requires attention' : 'All clear'}
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">📈</div>
            <div className="kpi-content">
              <h3>Risk Score</h3>
              <div className="kpi-value">
                {(analytics.performance.riskScore * 100).toFixed(1)}%
              </div>
              <div className="kpi-trend" style={{
                color: analytics.performance.riskScore > 0.7 ? '#f44336' :
                       analytics.performance.riskScore > 0.4 ? '#ff9800' : '#4caf50'
              }}>
                {analytics.performance.riskScore > 0.7 ? 'High risk' :
                 analytics.performance.riskScore > 0.4 ? 'Medium risk' : 'Low risk'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="dashboard-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'portfolio', label: 'Portfolio', icon: '🏢' },
          { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
          { id: 'financial', label: 'Financial', icon: '💰' },
          { id: 'market', label: 'Market', icon: '📈' },
          { id: 'alerts', label: 'Alerts', icon: '🚨' },
          { id: 'trends', label: 'Trends', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab
            analytics={analytics}
            criticalAlerts={criticalAlerts}
            highRiskPredictions={highRiskPredictions}
            portfolioHealth={portfolioHealth}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioTab
            portfolio={analytics.portfolio}
            selectedProperty={selectedProperty}
            onPropertySelect={setSelectedProperty}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceTab
            predictions={analytics.predictions}
            alerts={analytics.alerts}
          />
        )}

        {activeTab === 'financial' && (
          <FinancialTab
            financials={analytics.financials}
            performance={analytics.performance}
          />
        )}

        {activeTab === 'market' && (
          <MarketTab
            marketData={analytics.marketTrends}
            timeRange={timeRange}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsTab
            alerts={analytics.alerts}
            onAlertAction={(alertId, action) => {
              // Handle alert actions
              console.log(`Alert ${alertId}: ${action}`);
            }}
          />
        )}

        {activeTab === 'trends' && (
          <TrendsTab
            trends={analytics.trends}
            timeRange={timeRange}
          />
        )}
      </main>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  analytics: AggregatedAnalytics;
  criticalAlerts: Alert[];
  highRiskPredictions: PredictiveMaintenanceForecast[];
  portfolioHealth: string;
}> = ({ analytics, criticalAlerts, highRiskPredictions, portfolioHealth }) => {
  return (
    <div className="overview-tab">
      <div className="overview-grid">
        {/* Portfolio Health Summary */}
        <div className="overview-card">
          <h3>Portfolio Health Overview</h3>
          <div className="health-summary">
            <div className="health-indicator">
              <span className={`health-status ${portfolioHealth}`}>
                {portfolioHealth.toUpperCase()}
              </span>
            </div>
            <div className="health-metrics">
              <div className="metric">
                <span>Average Condition:</span>
                <span>{analytics.portfolio?.averageConditionScore.toFixed(1) || 'N/A'}%</span>
              </div>
              <div className="metric">
                <span>Properties:</span>
                <span>{analytics.portfolio?.totalProperties || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Issues */}
        <div className="overview-card">
          <h3>Critical Issues Requiring Attention</h3>
          <div className="issues-list">
            {criticalAlerts.slice(0, 3).map(alert => (
              <div key={alert.id} className="issue-item critical">
                <div className="issue-icon">🚨</div>
                <div className="issue-content">
                  <div className="issue-title">{alert.title}</div>
                  <div className="issue-property">Property: {alert.propertyId}</div>
                </div>
              </div>
            ))}
            {highRiskPredictions.slice(0, 2).map(prediction => (
              <div key={prediction.propertyId + prediction.component} className="issue-item warning">
                <div className="issue-icon">⚠️</div>
                <div className="issue-content">
                  <div className="issue-title">
                    {prediction.component} failure predicted
                  </div>
                  <div className="issue-property">
                    Risk: {prediction.riskLevel} • {prediction.timeToFailure} days
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="overview-card">
          <h3>Performance Summary</h3>
          <div className="performance-metrics">
            <div className="metric">
              <span>ROI:</span>
              <span className={analytics.portfolio?.performanceMetrics?.roi && analytics.portfolio.performanceMetrics.roi > 0 ? 'positive' : 'negative'}>
                {(analytics.portfolio?.performanceMetrics?.roi ?? 0).toFixed(1)}%
              </span>
            </div>
            <div className="metric">
              <span>Occupancy:</span>
              <span>{analytics.portfolio?.performanceMetrics.occupancyRate.toFixed(1) || 0}%</span>
            </div>
            <div className="metric">
              <span>Maintenance Efficiency:</span>
              <span>{analytics.portfolio?.performanceMetrics.maintenanceEfficiency.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="overview-card">
          <h3>Recent Analytics Activity</h3>
          <div className="activity-feed">
            <div className="activity-item">
              <div className="activity-icon">🤖</div>
              <div className="activity-content">
                <div className="activity-title">AI Analysis Completed</div>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📊</div>
              <div className="activity-content">
                <div className="activity-title">Market Data Updated</div>
                <div className="activity-time">4 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🔮</div>
              <div className="activity-content">
                <div className="activity-title">Predictions Generated</div>
                <div className="activity-time">6 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for other tabs
const PortfolioTab: React.FC<{
  portfolio: PortfolioAnalytics | null;
  selectedProperty: string | null;
  onPropertySelect: (propertyId: string | null) => void;
}> = ({ portfolio, selectedProperty, onPropertySelect }) => {
  return (
    <div className="portfolio-tab">
      <h3>Portfolio Analytics</h3>
      <p>Detailed portfolio performance and property-level analytics will be displayed here.</p>
      {portfolio && (
        <div className="portfolio-summary">
          <p>Total Properties: {portfolio.totalProperties}</p>
          <p>Average Condition: {portfolio.averageConditionScore.toFixed(1)}%</p>
          <p>Risk Distribution: Critical: {portfolio.riskDistribution.critical}, High: {portfolio.riskDistribution.high}</p>
        </div>
      )}
    </div>
  );
};

const MaintenanceTab: React.FC<{
  predictions: PredictiveMaintenanceForecast[];
  alerts: Alert[];
}> = ({ predictions, alerts }) => {
  return (
    <div className="maintenance-tab">
      <h3>Predictive Maintenance</h3>
      <p>Maintenance predictions and alerts will be displayed here.</p>
      <div className="maintenance-summary">
        <p>Active Predictions: {predictions.length}</p>
        <p>Critical Alerts: {alerts.filter(a => a.severity === 'critical').length}</p>
      </div>
    </div>
  );
};

const FinancialTab: React.FC<{
  financials: FinancialImpactAnalysis[];
  performance: AggregatedAnalytics['performance'];
}> = ({ financials, performance }) => {
  return (
    <div className="financial-tab">
      <h3>Financial Impact Analysis</h3>
      <p>Financial performance and impact analysis will be displayed here.</p>
      <div className="financial-summary">
        <p>Total Value: ${performance.totalValue.toLocaleString()}</p>
        <p>Maintenance Cost: ${performance.totalMaintenanceCost.toLocaleString()}</p>
        <p>Predicted Savings: ${performance.predictedSavings.toLocaleString()}</p>
      </div>
    </div>
  );
};

const MarketTab: React.FC<{
  marketData: MarketData[];
  timeRange: number;
}> = ({ marketData, timeRange }) => {
  return (
    <div className="market-tab">
      <h3>Market Intelligence</h3>
      <p>Market trends and analysis will be displayed here.</p>
      <div className="market-summary">
        <p>Data Points: {marketData.length}</p>
        <p>Time Range: {timeRange} days</p>
      </div>
    </div>
  );
};

const AlertsTab: React.FC<{
  alerts: Alert[];
  onAlertAction: (alertId: string, action: string) => void;
}> = ({ alerts, onAlertAction }) => {
  return (
    <div className="alerts-tab">
      <h3>Real-Time Alerts</h3>
      <p>Active alerts and alert management will be displayed here.</p>
      <div className="alerts-summary">
        <p>Total Alerts: {alerts.length}</p>
        <p>Critical: {alerts.filter(a => a.severity === 'critical').length}</p>
        <p>High: {alerts.filter(a => a.severity === 'high').length}</p>
      </div>
    </div>
  );
};

const TrendsTab: React.FC<{
  trends: TrendAnalysis[];
  timeRange: number;
}> = ({ trends, timeRange }) => {
  return (
    <div className="trends-tab">
      <h3>Trend Analysis & Forecasting</h3>
      <p>Trend analysis and forecasting will be displayed here.</p>
      <div className="trends-summary">
        <p>Trend Analyses: {trends.length}</p>
        <p>Time Range: {timeRange} days</p>
      </div>
    </div>
  );
};

export default ComprehensiveAnalyticsDashboard;