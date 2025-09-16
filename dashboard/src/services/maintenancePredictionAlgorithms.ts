/**
 * Advanced Maintenance Prediction Algorithms
 *
 * Sophisticated algorithms for predicting maintenance needs, failure probabilities,
 * and optimal maintenance scheduling using machine learning and statistical models.
 *
 * Features:
 * - Weibull distribution-based failure prediction
 * - Multi-factor risk assessment
 * - Predictive maintenance scheduling
 * - Cost-benefit optimization
 * - Environmental factor analysis
 */

import { PropertyData, MaintenanceRecord } from '../types/property';
import { machineLearningModelsService } from './machineLearningModels';

export interface MaintenancePredictionConfig {
  predictionHorizon: number; // months
  confidenceThreshold: number;
  riskTolerance: 'low' | 'medium' | 'high';
  costOptimization: boolean;
  environmentalFactors: boolean;
}

export interface ComponentFailurePrediction {
  component: string;
  failureProbability: number;
  timeToFailure: number; // days
  confidence: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  contributingFactors: string[];
  recommendedAction: string;
  costImpact: {
    preventiveCost: number;
    correctiveCost: number;
    downtimeCost: number;
    totalSavings: number;
  };
}

export interface MaintenanceSchedule {
  component: string;
  optimalDate: Date;
  priority: number;
  estimatedCost: number;
  expectedBenefit: number;
  confidence: number;
}

export interface EnvironmentalFactors {
  temperature: number;
  humidity: number;
  usageIntensity: number;
  ageMultiplier: number;
  locationRisk: number;
}

export class MaintenancePredictionAlgorithms {
  private config: MaintenancePredictionConfig;
  private mlModels: typeof machineLearningModelsService;

  constructor(config: Partial<MaintenancePredictionConfig> = {}) {
    this.config = {
      predictionHorizon: 12,
      confidenceThreshold: 0.7,
      riskTolerance: 'medium',
      costOptimization: true,
      environmentalFactors: true,
      ...config
    };
    this.mlModels = machineLearningModelsService;
  }

  /**
   * Advanced failure prediction using Weibull distribution and ML models
   */
  async predictComponentFailureAdvanced(
    property: PropertyData,
    component: string,
    maintenanceHistory: MaintenanceRecord[],
    environmentalFactors?: EnvironmentalFactors
  ): Promise<ComponentFailurePrediction> {
    // Gather comprehensive data
    const componentHistory = maintenanceHistory.filter(
      m => m.type === component && m.propertyId === property.id
    );

    const mlAnalysis = await this.mlModels.analyzePropertyCondition(property);
    const componentCondition = mlAnalysis.breakdown[component] || 50;

    // Calculate base failure probability using Weibull distribution
    const weibullPrediction = this.calculateWeibullFailureProbability(
      component,
      componentHistory,
      property.yearBuilt || new Date().getFullYear()
    );

    // Apply environmental factors
    const environmentalMultiplier = environmentalFactors ?
      this.calculateEnvironmentalMultiplier(component, environmentalFactors) : 1.0;

    // ML-enhanced prediction
    const mlPrediction = await this.mlEnhancedPrediction(
      component,
      componentCondition,
      componentHistory,
      environmentalFactors
    );

    // Combine predictions with weighted average
    const combinedProbability = (weibullPrediction * 0.4) + (mlPrediction * 0.6);
    const adjustedProbability = combinedProbability * environmentalMultiplier;

    // Calculate time to failure
    const timeToFailure = this.calculateTimeToFailure(adjustedProbability, component);

    // Determine risk level with dynamic thresholds
    const riskLevel = this.determineRiskLevel(adjustedProbability, timeToFailure);

    // Identify contributing factors
    const contributingFactors = this.identifyContributingFactors(
      component,
      componentCondition,
      componentHistory,
      environmentalFactors
    );

    // Generate recommendation
    const recommendedAction = this.generateAdvancedRecommendation(
      component,
      riskLevel,
      timeToFailure,
      contributingFactors
    );

    // Calculate cost impact
    const costImpact = this.calculateCostImpact(
      component,
      riskLevel,
      timeToFailure,
      componentCondition
    );

    return {
      component,
      failureProbability: Math.min(0.95, Math.max(0.01, adjustedProbability)),
      timeToFailure,
      confidence: this.calculatePredictionConfidence(componentHistory, mlAnalysis),
      riskLevel,
      contributingFactors,
      recommendedAction,
      costImpact
    };
  }

  /**
   * Calculate failure probability using Weibull distribution
   */
  private calculateWeibullFailureProbability(
    component: string,
    history: MaintenanceRecord[],
    propertyAge: number
  ): number {
    // Weibull parameters for different components (shape, scale)
    const weibullParams: Record<string, { shape: number; scale: number }> = {
      roofing: { shape: 2.5, scale: 20 }, // years
      structural: { shape: 3.0, scale: 30 },
      hvac: { shape: 2.0, scale: 15 },
      plumbing: { shape: 2.2, scale: 18 },
      electrical: { shape: 2.8, scale: 25 },
      painting: { shape: 3.2, scale: 35 },
      flooring: { shape: 3.5, scale: 40 },
      security: { shape: 2.5, scale: 25 },
      other: { shape: 2.5, scale: 25 }
    };

    const params = weibullParams[component] || { shape: 2.5, scale: 25 };
    const age = (new Date().getFullYear() - propertyAge) / params.scale;

    // Weibull CDF: 1 - exp(-(t/λ)^k)
    const failureProbability = 1 - Math.exp(-Math.pow(age, params.shape));

    // Adjust based on maintenance history
    const maintenanceAdjustment = this.calculateMaintenanceAdjustment(history);
    return Math.min(0.9, failureProbability * maintenanceAdjustment);
  }

  /**
   * ML-enhanced prediction using historical patterns
   */
  private async mlEnhancedPrediction(
    component: string,
    condition: number,
    history: MaintenanceRecord[],
    environmentalFactors?: EnvironmentalFactors
  ): Promise<number> {
    // Use ML model to predict failure probability
    const features = {
      condition,
      maintenanceFrequency: history.length,
      lastMaintenance: history.length > 0 ?
        (Date.now() - new Date(history[history.length - 1].date).getTime()) / (1000 * 60 * 60 * 24) : 365,
      environmentalStress: environmentalFactors ?
        (environmentalFactors.temperature + environmentalFactors.humidity + environmentalFactors.usageIntensity) / 3 : 50
    };

    // Mock ML prediction - in real implementation, this would call the ML service
    const baseProbability = condition < 30 ? 0.8 :
                           condition < 50 ? 0.6 :
                           condition < 70 ? 0.3 : 0.1;

    const maintenanceFactor = features.maintenanceFrequency > 2 ? 0.7 :
                             features.maintenanceFrequency === 0 ? 1.3 : 1.0;

    const timeFactor = features.lastMaintenance > 180 ? 1.2 : 0.9;

    return Math.min(0.9, baseProbability * maintenanceFactor * timeFactor);
  }

  /**
   * Calculate environmental multiplier
   */
  private calculateEnvironmentalMultiplier(
    component: string,
    factors: EnvironmentalFactors
  ): number {
    const multipliers: Record<string, (f: EnvironmentalFactors) => number> = {
      roofing: (f) => 1 + (f.temperature > 30 ? 0.2 : 0) + (f.humidity > 80 ? 0.15 : 0),
      structural: (f) => 1 + (f.humidity > 70 ? 0.25 : 0) + (f.temperature < 0 ? 0.2 : 0),
      hvac: (f) => 1 + (f.temperature > 35 || f.temperature < -10 ? 0.3 : 0) + (f.usageIntensity > 80 ? 0.2 : 0),
      plumbing: (f) => 1 + (f.temperature < 0 ? 0.4 : 0) + (f.usageIntensity > 90 ? 0.15 : 0),
      electrical: (f) => 1 + (f.humidity > 75 ? 0.2 : 0) + (f.usageIntensity > 85 ? 0.25 : 0),
      painting: (f) => 1 + (f.humidity > 70 ? 0.1 : 0) + (f.temperature > 25 ? 0.1 : 0),
      flooring: (f) => 1 + (f.humidity > 75 ? 0.15 : 0) + (f.usageIntensity > 85 ? 0.1 : 0),
      security: (f) => 1 + (f.temperature < -5 ? 0.1 : 0) + (f.humidity > 80 ? 0.1 : 0),
      other: (f) => 1 + (f.temperature > 30 || f.temperature < -10 ? 0.15 : 0) + (f.humidity > 75 ? 0.1 : 0)
    };

    return multipliers[component]?.(factors) || 1.0;
  }

  /**
   * Calculate time to failure based on probability
   */
  private calculateTimeToFailure(probability: number, component: string): number {
    // Inverse relationship: higher probability = shorter time to failure
    const baseLifespan: Record<string, number> = {
      roofing: 365 * 20, // 20 years
      structural: 365 * 50, // 50 years
      hvac: 365 * 15, // 15 years
      plumbing: 365 * 25, // 25 years
      electrical: 365 * 30, // 30 years
      painting: 365 * 40, // 40 years
      flooring: 365 * 45, // 45 years
      security: 365 * 25, // 25 years
      other: 365 * 25 // 25 years
    };

    const lifespan = baseLifespan[component] || 365 * 25;
    return Math.max(30, Math.round(lifespan * (1 - probability)));
  }

  /**
   * Determine risk level with dynamic thresholds
   */
  private determineRiskLevel(probability: number, timeToFailure: number): 'critical' | 'high' | 'medium' | 'low' {
    if (probability > 0.7 || timeToFailure < 90) return 'critical';
    if (probability > 0.5 || timeToFailure < 180) return 'high';
    if (probability > 0.3 || timeToFailure < 365) return 'medium';
    return 'low';
  }

  /**
   * Identify contributing factors to failure
   */
  private identifyContributingFactors(
    component: string,
    condition: number,
    history: MaintenanceRecord[],
    environmentalFactors?: EnvironmentalFactors
  ): string[] {
    const factors: string[] = [];

    if (condition < 50) factors.push('Poor component condition');
    if (history.length === 0) factors.push('No recent maintenance');
    if (history.length > 0) {
      const lastMaintenance = new Date(history[history.length - 1].date);
      const daysSince = (Date.now() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 365) factors.push('Overdue maintenance');
    }

    if (environmentalFactors) {
      if (environmentalFactors.temperature > 35 || environmentalFactors.temperature < -10) {
        factors.push('Extreme temperature exposure');
      }
      if (environmentalFactors.humidity > 80) factors.push('High humidity exposure');
      if (environmentalFactors.usageIntensity > 90) factors.push('High usage intensity');
    }

    return factors;
  }

  /**
   * Generate advanced maintenance recommendation
   */
  private generateAdvancedRecommendation(
    component: string,
    riskLevel: string,
    timeToFailure: number,
    factors: string[]
  ): string {
    const recommendations: Record<string, Record<string, string>> = {
      roofing: {
        critical: 'Immediate roof replacement required - failure imminent',
        high: 'Schedule comprehensive roof inspection within 30 days',
        medium: 'Plan roof maintenance for next 3 months',
        low: 'Annual roof inspection recommended'
      },
      structural: {
        critical: 'Urgent structural assessment by certified engineer',
        high: 'Schedule foundation inspection within 60 days',
        medium: 'Monitor for signs of settling or cracks',
        low: 'Annual foundation inspection sufficient'
      },
      hvac: {
        critical: 'Replace HVAC system immediately to prevent failure',
        high: 'Schedule HVAC service and efficiency testing',
        medium: 'Clean and maintain HVAC system quarterly',
        low: 'Annual HVAC maintenance and inspection'
      },
      plumbing: {
        critical: 'Immediate plumbing repair required - leak risk',
        high: 'Schedule plumbing inspection within 30 days',
        medium: 'Plan plumbing maintenance for next 2 months',
        low: 'Annual plumbing inspection recommended'
      },
      electrical: {
        critical: 'Urgent electrical assessment required - safety risk',
        high: 'Schedule electrical inspection within 30 days',
        medium: 'Plan electrical maintenance for next 3 months',
        low: 'Annual electrical inspection recommended'
      },
      painting: {
        critical: 'Immediate repainting required - protection compromised',
        high: 'Schedule painting inspection within 60 days',
        medium: 'Plan painting maintenance for next 6 months',
        low: 'Annual painting inspection recommended'
      },
      flooring: {
        critical: 'Immediate flooring repair required - safety hazard',
        high: 'Schedule flooring inspection within 45 days',
        medium: 'Plan flooring maintenance for next 4 months',
        low: 'Annual flooring inspection recommended'
      },
      security: {
        critical: 'Immediate security system replacement required',
        high: 'Schedule security system inspection within 30 days',
        medium: 'Plan security maintenance for next 3 months',
        low: 'Annual security system inspection recommended'
      },
      other: {
        critical: 'Immediate assessment required for this component',
        high: 'Schedule inspection within 30 days',
        medium: 'Plan maintenance for next 3 months',
        low: 'Annual inspection recommended'
      }
    };

    return recommendations[component]?.[riskLevel] ||
           `Schedule ${component} assessment based on risk factors: ${factors.join(', ')}`;
  }

  /**
   * Calculate comprehensive cost impact
   */
  private calculateCostImpact(
    component: string,
    riskLevel: string,
    timeToFailure: number,
    condition: number
  ): ComponentFailurePrediction['costImpact'] {
    const baseCosts: Record<string, { preventive: number; corrective: number; downtime: number }> = {
      roofing: { preventive: 800, corrective: 5000, downtime: 1000 },
      structural: { preventive: 1200, corrective: 15000, downtime: 2000 },
      hvac: { preventive: 600, corrective: 3000, downtime: 500 },
      plumbing: { preventive: 400, corrective: 2000, downtime: 300 },
      electrical: { preventive: 500, corrective: 2500, downtime: 400 },
      painting: { preventive: 300, corrective: 1500, downtime: 200 },
      flooring: { preventive: 500, corrective: 3000, downtime: 400 },
      security: { preventive: 400, corrective: 2000, downtime: 300 },
      other: { preventive: 300, corrective: 1500, downtime: 200 }
    };

    const costs = baseCosts[component] || { preventive: 500, corrective: 2500, downtime: 500 };
    const multiplier = { critical: 2.5, high: 1.8, medium: 1.3, low: 1.0 }[riskLevel] || 1.0;

    const preventiveCost = Math.round(costs.preventive * multiplier);
    const correctiveCost = Math.round(costs.corrective * multiplier);
    const downtimeCost = Math.round(costs.downtime * multiplier);

    // Calculate potential savings from preventive maintenance
    const savings = correctiveCost + downtimeCost - preventiveCost;

    return {
      preventiveCost,
      correctiveCost,
      downtimeCost,
      totalSavings: Math.max(0, savings)
    };
  }

  /**
   * Calculate prediction confidence
   */
  private calculatePredictionConfidence(
    history: MaintenanceRecord[],
    mlAnalysis: any
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence with more historical data
    if (history.length > 5) confidence += 0.2;
    else if (history.length > 2) confidence += 0.1;

    // Increase confidence with better ML analysis
    if (mlAnalysis.confidence > 0.8) confidence += 0.2;
    else if (mlAnalysis.confidence > 0.6) confidence += 0.1;

    return Math.min(0.95, confidence);
  }

  /**
   * Calculate maintenance adjustment factor
   */
  private calculateMaintenanceAdjustment(history: MaintenanceRecord[]): number {
    if (history.length === 0) return 1.3; // No maintenance = higher risk

    const recentMaintenance = history.filter(record => {
      const recordDate = new Date(record.date);
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      return recordDate > sixMonthsAgo;
    });

    if (recentMaintenance.length > 2) return 0.8; // Good maintenance = lower risk
    if (recentMaintenance.length > 0) return 0.9; // Some maintenance = moderate risk

    return 1.1; // Old maintenance = slightly higher risk
  }

  /**
   * Generate optimal maintenance schedule
   */
  async generateOptimalMaintenanceSchedule(
    property: PropertyData,
    maintenanceHistory: MaintenanceRecord[],
    predictions: ComponentFailurePrediction[]
  ): Promise<MaintenanceSchedule[]> {
    const schedule: MaintenanceSchedule[] = [];

    for (const prediction of predictions) {
      if (prediction.failureProbability < 0.3) continue; // Only schedule for significant risk

      const optimalDate = new Date(Date.now() + (prediction.timeToFailure * 0.7) * 24 * 60 * 60 * 1000);
      const priority = this.calculateMaintenancePriority(prediction);
      const estimatedCost = prediction.costImpact.preventiveCost;
      const expectedBenefit = prediction.costImpact.totalSavings;

      schedule.push({
        component: prediction.component,
        optimalDate,
        priority,
        estimatedCost,
        expectedBenefit,
        confidence: prediction.confidence
      });
    }

    // Sort by priority and date
    return schedule.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.optimalDate.getTime() - b.optimalDate.getTime();
    });
  }

  /**
   * Calculate maintenance priority
   */
  private calculateMaintenancePriority(prediction: ComponentFailurePrediction): number {
    const riskMultiplier = { critical: 10, high: 7, medium: 4, low: 1 }[prediction.riskLevel] || 1;
    const timeMultiplier = prediction.timeToFailure < 90 ? 2 : prediction.timeToFailure < 180 ? 1.5 : 1;
    const savingsMultiplier = prediction.costImpact.totalSavings > 5000 ? 1.5 : 1;

    return Math.round(riskMultiplier * timeMultiplier * savingsMultiplier);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MaintenancePredictionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): MaintenancePredictionConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const maintenancePredictionAlgorithms = new MaintenancePredictionAlgorithms();