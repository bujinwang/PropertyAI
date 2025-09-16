/**
 * Analytics-related types for the PropertyAI system
 */

export interface AnalyticsResult {
  propertyId: string;
  timestamp: Date;
  conditionScore: number;
  conditionBreakdown: Record<string, number>;
  predictiveMaintenance: PredictiveMaintenanceForecast[];
  financialImpact: FinancialImpactAnalysis;
  trendAnalysis: TrendAnalysis;
  riskAssessment: RiskAssessment;
  confidence: number;
  recommendations: string[];
}

export interface PredictiveInsight {
  id: string;
  type: 'maintenance' | 'financial' | 'risk' | 'trend';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  createdAt: Date;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  mitigationStrategies: string[];
  confidence: number;
}

export interface PredictiveMaintenanceForecast {
  propertyId: string;
  component: string;
  failureProbability: number;
  timeToFailure: number;
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
  breakEvenPeriod: number;
}

export interface TrendAnalysis {
  propertyId: string;
  trends: {
    condition: {
      current: number;
      trend: 'improving' | 'stable' | 'declining';
      rate: number;
      forecast: number[];
    };
    maintenance: {
      current: number;
      trend: 'increasing' | 'stable' | 'decreasing';
      rate: number;
      forecast: number[];
    };
    value: {
      current: number;
      trend: 'appreciating' | 'stable' | 'depreciating';
      rate: number;
      forecast: number[];
    };
  };
  insights: string[];
  recommendations: string[];
}