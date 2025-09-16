/**
 * Machine Learning Models Service
 *
 * Advanced ML models for property analysis, predictive maintenance, and intelligent insights.
 */

import { PropertyData, MaintenanceRecord, PropertyConditionScore, PredictiveMaintenancePrediction, PreventiveAction } from '../types/property';

export class MachineLearningModelsService {
  private static instance: MachineLearningModelsService;

  private constructor() {}

  public static getInstance(): MachineLearningModelsService {
    if (!MachineLearningModelsService.instance) {
      MachineLearningModelsService.instance = new MachineLearningModelsService();
    }
    return MachineLearningModelsService.instance;
  }

  /**
   * Analyze property condition using advanced ML models
   */
  async analyzePropertyCondition(property: PropertyData): Promise<PropertyConditionScore> {
    // This would integrate with actual ML models
    // For now, returning mock data structure
    return {
      overall: 75,
      factors: [
        { feature: 'roof', score: 70, condition: 'good', impact: 0.8 },
        { feature: 'foundation', score: 80, condition: 'excellent', impact: 0.9 },
        { feature: 'hvac', score: 65, condition: 'fair', impact: 0.7 }
      ],
      breakdown: {
        structural: 80,
        exterior: 75,
        interior: 70,
        systems: 65,
        curb: 85
      },
      confidence: 0.85
    };
  }

  /**
   * Estimate property value using ML models
   */
  async estimatePropertyValue(property: PropertyData, marketData: any[]): Promise<any> {
    // Mock implementation
    return {
      estimatedValue: property.purchasePrice || 300000,
      confidence: 0.8,
      range: {
        low: (property.purchasePrice || 300000) * 0.9,
        high: (property.purchasePrice || 300000) * 1.1
      }
    };
  }

  /**
   * Generate predictive maintenance predictions
   */
  async predictMaintenanceNeeds(
    property: PropertyData,
    maintenanceHistory: MaintenanceRecord[]
  ): Promise<PredictiveMaintenancePrediction[]> {
    const predictions: PredictiveMaintenancePrediction[] = [];

    // Mock predictions for key components
    const components = ['roof', 'hvac', 'plumbing', 'electrical'];

    for (const component of components) {
      const prediction = await this.predictComponentFailure(component, property, maintenanceHistory);
      predictions.push(prediction);
    }

    return predictions;
  }

  private async predictComponentFailure(
    componentType: string,
    property: PropertyData,
    history: MaintenanceRecord[]
  ): Promise<PredictiveMaintenancePrediction> {
    const baseFailureRate = this.getBaseFailureRate(componentType);
    const conditionMultiplier = 1.0; // Would be calculated from property condition
    const ageMultiplier = this.calculateAgeMultiplier(componentType, history);

    const failureProbability = Math.min(0.95, baseFailureRate * conditionMultiplier * ageMultiplier);
    const timeToFailure = this.predictTimeToFailure(failureProbability, componentType);
    const riskLevel = this.assessRiskLevel(failureProbability, timeToFailure);

    return {
      component: componentType,
      failureProbability,
      timeToFailure,
      riskLevel,
      contributingFactors: [`Age-related degradation`, `Usage patterns`],
      preventiveActions: this.generatePreventiveActions({ type: componentType }, riskLevel),
      costImpact: this.calculateCostImpact({ type: componentType }, failureProbability),
      confidence: 0.75
    };
  }

  private getBaseFailureRate(componentType: string): number {
    const baseRates: Record<string, number> = {
      roof: 0.15,
      hvac: 0.12,
      plumbing: 0.08,
      electrical: 0.06,
      foundation: 0.05,
      windows: 0.07,
      doors: 0.04
    };

    return baseRates[componentType] || 0.1;
  }

  private calculateConditionMultiplier(componentType: string, conditionScore: PropertyConditionScore): number {
    // Get relevant condition factors for this component type
    const relevantFactors = conditionScore.factors.filter(factor => {
      const feature = factor.feature.toLowerCase();
      const type = componentType.toLowerCase();

      if (type === 'roof' && feature.includes('roof')) return true;
      if (type === 'hvac' && feature.includes('hvac')) return true;
      if (type === 'plumbing' && feature.includes('plumbing')) return true;
      if (type === 'electrical' && feature.includes('electrical')) return true;
      if (type === 'foundation' && feature.includes('foundation')) return true;
      if (type === 'windows' && feature.includes('window')) return true;
      if (type === 'doors' && feature.includes('door')) return true;

      return false;
    });

    if (relevantFactors.length === 0) return 1.0;

    // Calculate average condition score and convert to multiplier
    const averageScore = relevantFactors.reduce((sum, factor) => sum + factor.score, 0) / relevantFactors.length;

    if (averageScore >= 80) return 0.8; // Good condition reduces failure risk
    if (averageScore >= 60) return 1.0; // Average condition
    if (averageScore >= 40) return 1.5; // Poor condition increases failure risk
    return 2.0; // Critical condition significantly increases failure risk
  }

  private calculateAgeMultiplier(componentType: string, historicalData: any[]): number {
    // This would analyze historical maintenance data to determine age impact
    // For now, using simplified age-based multipliers
    const ageMultipliers: Record<string, number[]> = {
      roof: [1.0, 1.2, 1.5, 2.0, 3.0], // 0-5, 6-10, 11-15, 16-20, 20+ years
      hvac: [1.0, 1.3, 1.8, 2.5, 4.0],
      plumbing: [1.0, 1.1, 1.3, 1.6, 2.2],
      electrical: [1.0, 1.1, 1.4, 1.8, 2.5],
      foundation: [1.0, 1.0, 1.1, 1.2, 1.5],
      windows: [1.0, 1.1, 1.3, 1.6, 2.0],
      doors: [1.0, 1.0, 1.2, 1.4, 1.8]
    };

    const multipliers = ageMultipliers[componentType] || [1.0, 1.2, 1.5, 2.0, 3.0];

    // Simplified age estimation (would be based on historical data)
    const estimatedAge = this.estimateComponentAge(componentType, historicalData);
    const ageIndex = Math.min(Math.floor(estimatedAge / 5), 4);

    return multipliers[ageIndex];
  }

  private estimateComponentAge(componentType: string, historicalData: any[]): number {
    // This would analyze maintenance history to estimate component age
    // For now, using default ages based on component type
    const defaultAges: Record<string, number> = {
      roof: 8,
      hvac: 6,
      plumbing: 15,
      electrical: 12,
      foundation: 25,
      windows: 10,
      doors: 8
    };

    return defaultAges[componentType] || 10;
  }

  private predictTimeToFailure(failureProbability: number, componentType: string): number {
    // Convert failure probability to estimated time to failure in days
    if (failureProbability < 0.1) return 365 * 5; // 5 years
    if (failureProbability < 0.2) return 365 * 2; // 2 years
    if (failureProbability < 0.3) return 365 * 1; // 1 year
    if (failureProbability < 0.5) return 180; // 6 months
    if (failureProbability < 0.7) return 90; // 3 months
    if (failureProbability < 0.9) return 30; // 1 month
    return 7; // 1 week
  }

  private assessRiskLevel(failureProbability: number, timeToFailure: number): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = failureProbability * (365 / Math.max(timeToFailure, 1));

    if (riskScore > 0.5) return 'critical';
    if (riskScore > 0.2) return 'high';
    if (riskScore > 0.1) return 'medium';
    return 'low';
  }

  private identifyContributingFactors(component: any, conditionScore: PropertyConditionScore): string[] {
    const factors: string[] = [];

    // Analyze condition factors that affect this component
    const relevantFactors = conditionScore.factors.filter(factor => {
      const feature = factor.feature.toLowerCase();
      const type = component.type.toLowerCase();

      if (type === 'roof' && feature.includes('roof')) return true;
      if (type === 'hvac' && feature.includes('hvac')) return true;
      if (type === 'plumbing' && feature.includes('plumbing')) return true;
      if (type === 'electrical' && feature.includes('electrical')) return true;
      if (type === 'foundation' && feature.includes('foundation')) return true;
      if (type === 'windows' && feature.includes('window')) return true;
      if (type === 'doors' && feature.includes('door')) return true;

      return false;
    });

    relevantFactors.forEach(factor => {
      if (factor.score < 70) {
        factors.push(`${factor.feature} in ${factor.condition} condition`);
      }
    });

    // Add component-specific factors
    if (component.type === 'roof') {
      factors.push('Weather exposure and UV degradation');
      factors.push('Lack of regular inspections');
    } else if (component.type === 'hvac') {
      factors.push('Filter maintenance and air quality');
      factors.push('Seasonal usage patterns');
    } else if (component.type === 'plumbing') {
      factors.push('Water quality and mineral buildup');
      factors.push('Pressure fluctuations');
    }

    return factors.slice(0, 5); // Return top 5 factors
  }

  private generatePreventiveActions(component: any, riskLevel: string): PreventiveAction[] {
    const actions: PreventiveAction[] = [];

    const componentActions: Record<string, PreventiveAction[]> = {
      roof: [
        {
          action: 'Annual roof inspection by certified professional',
          cost: 150,
          effectiveness: 0.8,
          timeline: '3 months',
          priority: 'high'
        },
        {
          action: 'Clean gutters and downspouts',
          cost: 200,
          effectiveness: 0.6,
          timeline: '6 months',
          priority: 'medium'
        },
        {
          action: 'Apply protective sealant',
          cost: 800,
          effectiveness: 0.7,
          timeline: '2 years',
          priority: 'medium'
        }
      ],
      hvac: [
        {
          action: 'Replace air filters quarterly',
          cost: 50,
          effectiveness: 0.9,
          timeline: '3 months',
          priority: 'high'
        },
        {
          action: 'Annual HVAC maintenance service',
          cost: 150,
          effectiveness: 0.8,
          timeline: '12 months',
          priority: 'high'
        },
        {
          action: 'Clean ductwork',
          cost: 300,
          effectiveness: 0.7,
          timeline: '3 years',
          priority: 'medium'
        }
      ],
      plumbing: [
        {
          action: 'Annual plumbing inspection',
          cost: 120,
          effectiveness: 0.8,
          timeline: '12 months',
          priority: 'medium'
        },
        {
          action: 'Install water softener if needed',
          cost: 800,
          effectiveness: 0.6,
          timeline: 'As needed',
          priority: 'low'
        }
      ],
      electrical: [
        {
          action: 'Annual electrical system inspection',
          cost: 200,
          effectiveness: 0.8,
          timeline: '12 months',
          priority: 'high'
        },
        {
          action: 'Test GFCI outlets',
          cost: 50,
          effectiveness: 0.7,
          timeline: '6 months',
          priority: 'medium'
        }
      ]
    };

    const availableActions = componentActions[component.type] || [];
    const priorityActions = availableActions.filter(action =>
      riskLevel === 'critical' ? action.priority === 'high' :
      riskLevel === 'high' ? ['high', 'medium'].includes(action.priority) :
      true
    );

    return priorityActions.slice(0, 3);
  }

  private calculateCostImpact(component: any, failureProbability: number): any {
    const repairCosts: Record<string, number> = {
      roof: 5000,
      hvac: 3000,
      plumbing: 800,
      electrical: 600,
      foundation: 15000,
      windows: 400,
      doors: 300
    };

    const downtimeCosts: Record<string, number> = {
      roof: 0,
      hvac: 200, // per day
      plumbing: 100,
      electrical: 500,
      foundation: 0,
      windows: 0,
      doors: 0
    };

    const repairCost = repairCosts[component.type] || 1000;
    const downtimeCost = downtimeCosts[component.type] || 0;
    const totalCost = repairCost + (downtimeCost * 7); // Assuming 1 week downtime

    return {
      repairCost,
      downtimeCost: downtimeCost * 7,
      total: totalCost
    };
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const machineLearningModelsService = MachineLearningModelsService.getInstance();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function calculatePropertyHealthScore(conditionScore: PropertyConditionScore): number {
  return conditionScore.overall;
}

export function getMaintenancePriority(prediction: PredictiveMaintenancePrediction): 'immediate' | 'scheduled' | 'monitoring' {
  if (prediction.riskLevel === 'critical' || prediction.timeToFailure < 30) {
    return 'immediate';
  }
  if (prediction.riskLevel === 'high' || prediction.timeToFailure < 90) {
    return 'scheduled';
  }
  return 'monitoring';
}

export function formatConditionScore(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Poor';
  return 'Critical';
}

export function getConditionColor(score: number): string {
  if (score >= 80) return '#4CAF50'; // Green
  if (score >= 60) return '#FF9800'; // Orange
  return '#F44336'; // Red
}