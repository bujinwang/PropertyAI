/**
 * Predictive Analytics Engine
 *
 * Advanced analytics engine that leverages machine learning models to provide
 * comprehensive property intelligence, predictive maintenance, and strategic insights.
 *
 * Features:
 * - Property portfolio analytics
 * - Predictive maintenance forecasting
 * - Financial impact analysis
 * - Risk assessment and mitigation
 * - Trend analysis and forecasting
 * - Performance optimization recommendations
 */

import { machineLearningModelsService } from './machineLearningModels';
import { PropertyData, MaintenanceRecord, MarketData } from '../types/property';
import { AnalyticsResult, PredictiveInsight, RiskAssessment } from '../types/analytics';

export interface PredictiveAnalyticsConfig {
  confidenceThreshold: number;
  riskTolerance: 'low' | 'medium' | 'high';
  forecastHorizon: number; // months
  updateFrequency: number; // hours
}

export interface PortfolioAnalytics {
  totalProperties: number;
  averageConditionScore: number;
  totalMaintenanceCost: number;
  predictedMaintenanceCost: number;
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  performanceMetrics: {
    roi: number;
    occupancyRate: number;
    maintenanceEfficiency: number;
  };
}

export interface PredictiveMaintenanceForecast {
  propertyId: string;
  component: string;
  failureProbability: number;
  timeToFailure: number; // days
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  recommendedAction: string;
  costImpact: {
    repairCost: number;
    downtimeCost: number;
    totalCost: number;
  };
  confidence: number;
}

export interface FinancialImpactAnalysis {
  propertyId: string;
  currentValue: number;
  predictedValue: number;
  maintenanceImpact: number;
  marketTrendImpact: number;
  netImpact: number;
  roiProjection: number;
  breakEvenPeriod: number; // months
}

export interface TrendAnalysis {
  propertyId: string;
  trends: {
    condition: {
      current: number;
      trend: 'improving' | 'stable' | 'declining';
      rate: number; // points per month
      forecast: number[]; // next 12 months
    };
    maintenance: {
      current: number;
      trend: 'increasing' | 'stable' | 'decreasing';
      rate: number; // dollars per month
      forecast: number[]; // next 12 months
    };
    value: {
      current: number;
      trend: 'appreciating' | 'stable' | 'depreciating';
      rate: number; // percentage per month
      forecast: number[]; // next 12 months
    };
  };
  insights: string[];
  recommendations: string[];
}

export class PredictiveAnalyticsEngine {
  private mlModels: typeof machineLearningModelsService;
  private config: PredictiveAnalyticsConfig;
  private analyticsCache: Map<string, AnalyticsResult>;
  private lastUpdate: Map<string, Date>;

  constructor(config: Partial<PredictiveAnalyticsConfig> = {}) {
    this.mlModels = machineLearningModelsService;
    this.config = {
      confidenceThreshold: 0.7,
      riskTolerance: 'medium',
      forecastHorizon: 12,
      updateFrequency: 24,
      ...config
    };
    this.analyticsCache = new Map();
    this.lastUpdate = new Map();
  }

  /**
   * Generate comprehensive portfolio analytics
   */
  async generatePortfolioAnalytics(
    properties: PropertyData[],
    maintenanceHistory: MaintenanceRecord[],
    marketData: MarketData[]
  ): Promise<PortfolioAnalytics> {
    const analytics = await Promise.all(
      properties.map(property =>
        this.generatePropertyAnalytics(property, maintenanceHistory, marketData)
      )
    );

    const totalProperties = properties.length;
    const averageConditionScore = analytics.reduce((sum, a) => sum + a.conditionScore, 0) / totalProperties;

    const totalMaintenanceCost = maintenanceHistory
      .filter(m => m.date >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      .reduce((sum, m) => sum + m.cost, 0);

    const predictedMaintenanceCost = analytics.reduce((sum, a) =>
      sum + a.predictiveMaintenance.reduce((cost, pm) => cost + pm.costImpact.totalCost, 0), 0
    );

    const riskDistribution = analytics.reduce((dist, a) => {
      a.predictiveMaintenance.forEach(pm => {
        dist[pm.riskLevel] = (dist[pm.riskLevel] || 0) + 1;
      });
      return dist;
    }, {} as Record<string, number>);

    const performanceMetrics = this.calculatePerformanceMetrics(analytics, marketData);

    return {
      totalProperties,
      averageConditionScore,
      totalMaintenanceCost,
      predictedMaintenanceCost,
      riskDistribution: {
        critical: riskDistribution.critical || 0,
        high: riskDistribution.high || 0,
        medium: riskDistribution.medium || 0,
        low: riskDistribution.low || 0
      },
      performanceMetrics
    };
  }

  /**
   * Generate predictive maintenance forecast for a property
   */
  async generatePredictiveMaintenanceForecast(
    property: PropertyData,
    maintenanceHistory: MaintenanceRecord[]
  ): Promise<PredictiveMaintenanceForecast[]> {
    const mlAnalysis = await this.mlModels.analyzePropertyCondition(property);

    const forecasts: PredictiveMaintenanceForecast[] = [];

    // Analyze each major component
    const components = [
      'roof', 'foundation', 'hvac', 'plumbing', 'electrical',
      'windows', 'doors', 'exterior', 'interior'
    ];

    for (const component of components) {
      const componentHistory = maintenanceHistory.filter(
        m => m.component === component && m.propertyId === property.id
      );

      const forecast = await this.predictComponentFailure(
        property,
        component,
        componentHistory,
        mlAnalysis
      );

      if (forecast.failureProbability > 0.1) { // Only include if risk exists
        forecasts.push(forecast);
      }
    }

    return forecasts.sort((a, b) => b.failureProbability - a.failureProbability);
  }

  /**
   * Generate financial impact analysis
   */
  async generateFinancialImpactAnalysis(
    property: PropertyData,
    maintenanceHistory: MaintenanceRecord[],
    marketData: MarketData[]
  ): Promise<FinancialImpactAnalysis> {
    const mlAnalysis = await this.mlModels.analyzePropertyCondition(property);
    const valueEstimation = await this.mlModels.estimatePropertyValue(property, marketData);

    const currentValue = valueEstimation.estimatedValue;
    const conditionImpact = (mlAnalysis.overall / 100) * currentValue;

    // Calculate maintenance impact
    const recentMaintenance = maintenanceHistory
      .filter(m => m.date >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      .reduce((sum, m) => sum + m.cost, 0);

    const predictedMaintenance = await this.generatePredictiveMaintenanceForecast(property, maintenanceHistory);
    const predictedCost = predictedMaintenance.reduce((sum, pm) => sum + pm.costImpact.totalCost, 0);

    const maintenanceImpact = recentMaintenance + predictedCost;

    // Market trend analysis
    const marketTrend = this.analyzeMarketTrends(marketData);
    const marketTrendImpact = (marketTrend.growthRate / 100) * currentValue * (this.config.forecastHorizon / 12);

    const netImpact = conditionImpact - maintenanceImpact + marketTrendImpact;
    const roiProjection = (netImpact / (currentValue + maintenanceImpact)) * 100;
    const breakEvenPeriod = maintenanceImpact > 0 ? (maintenanceImpact / (marketTrendImpact / 12)) : 0;

    return {
      propertyId: property.id,
      currentValue,
      predictedValue: currentValue + netImpact,
      maintenanceImpact,
      marketTrendImpact,
      netImpact,
      roiProjection,
      breakEvenPeriod
    };
  }

  /**
   * Generate trend analysis and forecasting
   */
  async generateTrendAnalysis(
    property: PropertyData,
    maintenanceHistory: MaintenanceRecord[],
    marketData: MarketData[]
  ): Promise<TrendAnalysis> {
    const historicalData = await this.gatherHistoricalData(property, maintenanceHistory, marketData);

    const conditionTrend = this.analyzeConditionTrend(historicalData.condition);
    const maintenanceTrend = this.analyzeMaintenanceTrend(historicalData.maintenance);
    const valueTrend = this.analyzeValueTrend(historicalData.value, marketData);

    const insights = this.generateTrendInsights(conditionTrend, maintenanceTrend, valueTrend);
    const recommendations = this.generateTrendRecommendations(conditionTrend, maintenanceTrend, valueTrend);

    return {
      propertyId: property.id,
      trends: {
        condition: conditionTrend,
        maintenance: maintenanceTrend,
        value: valueTrend
      },
      insights,
      recommendations
    };
  }

  /**
   * Generate comprehensive property analytics
   */
  async generatePropertyAnalytics(
    property: PropertyData,
    maintenanceHistory: MaintenanceRecord[],
    marketData: MarketData[]
  ): Promise<AnalyticsResult> {
    const cacheKey = `property-${property.id}`;
    const lastUpdate = this.lastUpdate.get(cacheKey);

    // Check if cache is still valid
    if (lastUpdate && (Date.now() - lastUpdate.getTime()) < (this.config.updateFrequency * 60 * 60 * 1000)) {
      return this.analyticsCache.get(cacheKey)!;
    }

    // Generate fresh analytics
    const [
      conditionAnalysis,
      predictiveMaintenance,
      financialImpact,
      trendAnalysis
    ] = await Promise.all([
      this.mlModels.analyzePropertyCondition(property),
      this.generatePredictiveMaintenanceForecast(property, maintenanceHistory),
      this.generateFinancialImpactAnalysis(property, maintenanceHistory, marketData),
      this.generateTrendAnalysis(property, maintenanceHistory, marketData)
    ]);

    const riskAssessment = this.assessOverallRisk(predictiveMaintenance, conditionAnalysis, financialImpact);

    const result: AnalyticsResult = {
      propertyId: property.id,
      timestamp: new Date(),
      conditionScore: conditionAnalysis.overall,
      conditionBreakdown: conditionAnalysis.breakdown,
      predictiveMaintenance,
      financialImpact,
      trendAnalysis,
      riskAssessment,
      confidence: Math.min(
        conditionAnalysis.confidence,
        predictiveMaintenance.reduce((min, pm) => Math.min(min, pm.confidence), 1),
        0.95 // Maximum confidence cap
      ),
      recommendations: this.generateActionableRecommendations(
        conditionAnalysis,
        predictiveMaintenance,
        financialImpact,
        trendAnalysis
      )
    };

    // Cache the result
    this.analyticsCache.set(cacheKey, result);
    this.lastUpdate.set(cacheKey, new Date());

    return result;
  }

  /**
   * Generate risk assessment
   */
  private assessOverallRisk(
    predictiveMaintenance: PredictiveMaintenanceForecast[],
    conditionAnalysis: any,
    financialImpact: FinancialImpactAnalysis
  ): RiskAssessment {
    const criticalCount = predictiveMaintenance.filter(pm => pm.riskLevel === 'critical').length;
    const highCount = predictiveMaintenance.filter(pm => pm.riskLevel === 'high').length;

    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (criticalCount > 0 || conditionAnalysis.conditionScore < 30) {
      overallRisk = 'critical';
    } else if (highCount > 2 || conditionAnalysis.conditionScore < 50) {
      overallRisk = 'high';
    } else if (highCount > 0 || conditionAnalysis.conditionScore < 70) {
      overallRisk = 'medium';
    }

    const riskFactors = [];
    if (conditionAnalysis.conditionScore < 50) riskFactors.push('Poor property condition');
    if (criticalCount > 0) riskFactors.push('Critical maintenance issues');
    if (financialImpact.netImpact < 0) riskFactors.push('Negative financial impact');
    if (financialImpact.roiProjection < 5) riskFactors.push('Low ROI projection');

    return {
      overallRisk,
      riskFactors,
      mitigationStrategies: this.generateRiskMitigationStrategies(overallRisk, riskFactors),
      confidence: 0.85
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateActionableRecommendations(
    conditionAnalysis: any,
    predictiveMaintenance: PredictiveMaintenanceForecast[],
    financialImpact: FinancialImpactAnalysis,
    trendAnalysis: TrendAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Condition-based recommendations
    if (conditionAnalysis.conditionScore < 50) {
      recommendations.push('Immediate condition assessment and repair prioritization needed');
    }

    // Maintenance recommendations
    const criticalMaintenance = predictiveMaintenance.filter(pm => pm.riskLevel === 'critical');
    if (criticalMaintenance.length > 0) {
      recommendations.push(`Address ${criticalMaintenance.length} critical maintenance issues immediately`);
    }

    // Financial recommendations
    if (financialImpact.roiProjection < 5) {
      recommendations.push('Consider property improvements to increase ROI potential');
    }

    // Trend-based recommendations
    if (trendAnalysis.trends.condition.trend === 'declining') {
      recommendations.push('Implement preventive maintenance program to reverse condition decline');
    }

    return recommendations;
  }

  /**
   * Helper methods for trend analysis
   */
  private analyzeConditionTrend(conditionHistory: number[]): { current: number; trend: 'improving' | 'stable' | 'declining'; rate: number; forecast: number[] } {
    if (conditionHistory.length < 2) {
      return {
        current: conditionHistory[0] || 0,
        trend: 'stable' as const,
        rate: 0,
        forecast: Array(12).fill(conditionHistory[0] || 0)
      };
    }

    const recent = conditionHistory.slice(-6);
    const rate = this.calculateTrendRate(recent);
    const trend: 'improving' | 'stable' | 'declining' = rate > 0.5 ? 'improving' : rate < -0.5 ? 'declining' : 'stable';
    const forecast = this.generateForecast(recent, rate, 12);

    return {
      current: recent[recent.length - 1],
      trend,
      rate,
      forecast
    };
  }

  private analyzeMaintenanceTrend(maintenanceHistory: number[]): { current: number; trend: 'increasing' | 'stable' | 'decreasing'; rate: number; forecast: number[] } {
    if (maintenanceHistory.length < 2) {
      return {
        current: maintenanceHistory[0] || 0,
        trend: 'stable' as const,
        rate: 0,
        forecast: Array(12).fill(maintenanceHistory[0] || 0)
      };
    }

    const recent = maintenanceHistory.slice(-6);
    const rate = this.calculateTrendRate(recent);
    const trend: 'increasing' | 'stable' | 'decreasing' = rate > 100 ? 'increasing' : rate < -100 ? 'decreasing' : 'stable';
    const forecast = this.generateForecast(recent, rate, 12);

    return {
      current: recent[recent.length - 1],
      trend,
      rate,
      forecast
    };
  }

  private analyzeValueTrend(valueHistory: number[], marketData: MarketData[]): { current: number; trend: 'appreciating' | 'stable' | 'depreciating'; rate: number; forecast: number[] } {
    if (valueHistory.length < 2) {
      return {
        current: valueHistory[0] || 0,
        trend: 'stable' as const,
        rate: 0,
        forecast: Array(12).fill(valueHistory[0] || 0)
      };
    }

    const recent = valueHistory.slice(-6);
    const rate = this.calculateTrendRate(recent);
    const trend: 'appreciating' | 'stable' | 'depreciating' = rate > 0.01 ? 'appreciating' : rate < -0.01 ? 'depreciating' : 'stable';
    const forecast = this.generateForecast(recent, rate, 12);

    return {
      current: recent[recent.length - 1],
      trend,
      rate,
      forecast
    };
  }

  private calculateTrendRate(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private generateForecast(values: number[], rate: number, periods: number): number[] {
    const forecast: number[] = [];
    let currentValue = values[values.length - 1];

    for (let i = 0; i < periods; i++) {
      currentValue += rate;
      forecast.push(Math.max(0, currentValue)); // Ensure non-negative values
    }

    return forecast;
  }

  private analyzeMarketTrends(marketData: MarketData[]) {
    const recentData = marketData.slice(-12); // Last 12 months
    const prices = recentData.map(d => d.averagePrice);

    if (prices.length < 2) {
      return { growthRate: 0, volatility: 0 };
    }

    const growthRate = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
    const volatility = this.calculateVolatility(prices);

    return { growthRate, volatility };
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < values.length; i++) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

    return Math.sqrt(variance) * 100; // Return as percentage
  }

  private generateTrendInsights(
    conditionTrend: any,
    maintenanceTrend: any,
    valueTrend: any
  ): string[] {
    const insights: string[] = [];

    if (conditionTrend.trend === 'declining') {
      insights.push('Property condition is declining, indicating need for increased maintenance investment');
    }

    if (maintenanceTrend.trend === 'increasing') {
      insights.push('Maintenance costs are rising, suggesting aging infrastructure or increased usage');
    }

    if (valueTrend.trend === 'appreciating' && conditionTrend.trend === 'stable') {
      insights.push('Property value is appreciating while maintaining condition, indicating good investment performance');
    }

    if (valueTrend.trend === 'depreciating' && conditionTrend.trend === 'declining') {
      insights.push('Both value and condition are declining, requiring immediate attention to prevent further loss');
    }

    return insights;
  }

  private generateTrendRecommendations(
    conditionTrend: any,
    maintenanceTrend: any,
    valueTrend: any
  ): string[] {
    const recommendations: string[] = [];

    if (conditionTrend.trend === 'declining') {
      recommendations.push('Implement comprehensive maintenance program to stabilize and improve condition');
    }

    if (maintenanceTrend.trend === 'increasing') {
      recommendations.push('Conduct detailed assessment to identify root causes of rising maintenance costs');
    }

    if (valueTrend.trend === 'depreciating') {
      recommendations.push('Consider property improvements or market repositioning to reverse depreciation');
    }

    if (conditionTrend.trend === 'improving' && valueTrend.trend === 'stable') {
      recommendations.push('Continue current maintenance strategy as it effectively preserves property value');
    }

    return recommendations;
  }

  private generateRiskMitigationStrategies(
    overallRisk: string,
    riskFactors: string[]
  ): string[] {
    const strategies: string[] = [];

    if (riskFactors.includes('Poor property condition')) {
      strategies.push('Schedule comprehensive property inspection and create repair prioritization plan');
    }

    if (riskFactors.includes('Critical maintenance issues')) {
      strategies.push('Engage emergency maintenance contractors and implement monitoring systems');
    }

    if (riskFactors.includes('Negative financial impact')) {
      strategies.push('Review maintenance budget allocation and consider refinancing options');
    }

    if (riskFactors.includes('Low ROI projection')) {
      strategies.push('Conduct market analysis and consider property repositioning strategies');
    }

    return strategies;
  }

  private calculatePerformanceMetrics(
    analytics: AnalyticsResult[],
    marketData: MarketData[]
  ) {
    const totalValue = analytics.reduce((sum, a) => sum + a.financialImpact.currentValue, 0);
    const totalMaintenance = analytics.reduce((sum, a) => sum + a.financialImpact.maintenanceImpact, 0);

    // Simplified ROI calculation
    const roi = totalValue > 0 ? ((totalValue - totalMaintenance) / totalValue) * 100 : 0;

    // Mock occupancy rate (would need actual tenant data)
    const occupancyRate = 95;

    // Maintenance efficiency based on condition scores
    const avgCondition = analytics.reduce((sum, a) => sum + a.conditionScore, 0) / analytics.length;
    const maintenanceEfficiency = Math.min(100, avgCondition * 1.2);

    return {
      roi,
      occupancyRate,
      maintenanceEfficiency
    };
  }

  private async predictComponentFailure(
    property: PropertyData,
    component: string,
    history: MaintenanceRecord[],
    mlAnalysis: any
  ): Promise<PredictiveMaintenanceForecast> {
    // Simplified failure prediction based on condition and history
    const componentCondition = mlAnalysis.breakdown[component] || 50;
    const recentMaintenance = history.filter(
      m => new Date(m.date).getTime() > Date.now() - 365 * 24 * 60 * 60 * 1000
    ).length;

    // Calculate failure probability based on condition and maintenance history
    let failureProbability = 0;

    if (componentCondition < 30) {
      failureProbability = 0.8;
    } else if (componentCondition < 50) {
      failureProbability = 0.6;
    } else if (componentCondition < 70) {
      failureProbability = 0.3;
    } else {
      failureProbability = 0.1;
    }

    // Adjust based on maintenance history
    if (recentMaintenance === 0) {
      failureProbability *= 1.5;
    } else if (recentMaintenance > 2) {
      failureProbability *= 0.7;
    }

    failureProbability = Math.min(0.95, Math.max(0.05, failureProbability));

    // Calculate time to failure
    const timeToFailure = Math.max(30, Math.round((1 - failureProbability) * 365));

    // Determine risk level
    let riskLevel: 'critical' | 'high' | 'medium' | 'low';
    if (failureProbability > 0.7) {
      riskLevel = 'critical';
    } else if (failureProbability > 0.5) {
      riskLevel = 'high';
    } else if (failureProbability > 0.3) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Generate recommended action
    const recommendedAction = this.generateMaintenanceRecommendation(component, riskLevel, componentCondition);

    // Estimate costs
    const costImpact = this.estimateMaintenanceCosts(component, riskLevel);

    return {
      propertyId: property.id,
      component,
      failureProbability,
      timeToFailure,
      riskLevel,
      recommendedAction,
      costImpact,
      confidence: 0.75
    };
  }

  private generateMaintenanceRecommendation(
    component: string,
    riskLevel: string,
    condition: number
  ): string {
    const recommendations = {
      roof: {
        critical: 'Immediate roof replacement required',
        high: 'Schedule roof inspection and repair',
        medium: 'Plan roof maintenance for next quarter',
        low: 'Monitor roof condition annually'
      },
      foundation: {
        critical: 'Urgent foundation assessment by structural engineer',
        high: 'Schedule foundation inspection',
        medium: 'Monitor for cracks and settling',
        low: 'Annual foundation inspection'
      },
      hvac: {
        critical: 'Replace HVAC system immediately',
        high: 'Schedule HVAC service and repair',
        medium: 'Clean and maintain HVAC system',
        low: 'Annual HVAC maintenance'
      }
    };

    return (recommendations as any)[component]?.[riskLevel] || `Schedule ${component} assessment`;
  }

  private estimateMaintenanceCosts(component: string, riskLevel: string): any {
    const baseCosts = {
      roof: { repair: 5000, downtime: 1000 },
      foundation: { repair: 15000, downtime: 2000 },
      hvac: { repair: 3000, downtime: 500 },
      plumbing: { repair: 2000, downtime: 300 },
      electrical: { repair: 2500, downtime: 400 }
    };

    const cost = (baseCosts as any)[component] || { repair: 1000, downtime: 200 };
    const multiplier = { critical: 2.0, high: 1.5, medium: 1.2, low: 1.0 }[riskLevel] || 1.0;

    return {
      repairCost: Math.round(cost.repair * multiplier),
      downtimeCost: Math.round(cost.downtime * multiplier),
      totalCost: Math.round((cost.repair + cost.downtime) * multiplier)
    };
  }

  private async gatherHistoricalData(
    property: PropertyData,
    maintenanceHistory: MaintenanceRecord[],
    marketData: MarketData[]
  ) {
    // This would typically query a database for historical data
    // For now, we'll generate mock historical data based on current state

    const conditionHistory = this.generateHistoricalConditionData(property);
    const maintenanceHistoryData = this.generateHistoricalMaintenanceData(maintenanceHistory);
    const valueHistory = this.generateHistoricalValueData(property, marketData);

    return {
      condition: conditionHistory,
      maintenance: maintenanceHistoryData,
      value: valueHistory
    };
  }

  private generateHistoricalConditionData(property: PropertyData): number[] {
    // Generate 12 months of historical condition data
    const currentCondition = 75; // This would come from ML analysis
    const history: number[] = [];

    for (let i = 11; i >= 0; i--) {
      const variation = (Math.random() - 0.5) * 10; // ±5 points variation
      history.push(Math.max(0, Math.min(100, currentCondition - i * 0.5 + variation)));
    }

    return history;
  }

  private generateHistoricalMaintenanceData(records: MaintenanceRecord[]): number[] {
    // Generate monthly maintenance cost data
    const monthlyCosts: number[] = [];

    for (let i = 11; i >= 0; i--) {
      const monthRecords = records.filter(r => {
        const recordMonth = new Date(r.date).getMonth();
        const targetMonth = (new Date().getMonth() - i + 12) % 12;
        return recordMonth === targetMonth;
      });

      const monthlyCost = monthRecords.reduce((sum, r) => sum + r.cost, 0);
      monthlyCosts.push(monthlyCost);
    }

    return monthlyCosts;
  }

  private generateHistoricalValueData(property: PropertyData, marketData: MarketData[]): number[] {
    // Generate historical value data based on market trends
    const currentValue = property.purchasePrice || 300000;
    const history: number[] = [];

    for (let i = 11; i >= 0; i--) {
      const marketAdjustment = marketData.length > 0 ?
        marketData[Math.min(i, marketData.length - 1)].averagePrice / marketData[0].averagePrice : 1;
      const value = currentValue * marketAdjustment * (1 - i * 0.005); // Slight depreciation over time
      history.push(value);
    }

    return history;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PredictiveAnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    // Clear cache when configuration changes
    this.analyticsCache.clear();
    this.lastUpdate.clear();
  }

  /**
   * Get current configuration
   */
  getConfig(): PredictiveAnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Clear analytics cache
   */
  clearCache(): void {
    this.analyticsCache.clear();
    this.lastUpdate.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; lastUpdate: Date | null } {
    return {
      size: this.analyticsCache.size,
      lastUpdate: Array.from(this.lastUpdate.values()).sort((a, b) => b.getTime() - a.getTime())[0] || null
    };
  }
}

// Export singleton instance
export const predictiveAnalyticsEngine = new PredictiveAnalyticsEngine();