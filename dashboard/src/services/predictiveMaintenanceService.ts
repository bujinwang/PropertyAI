/**
 * Predictive Maintenance Service
 * AI-powered maintenance prediction and alert system
 * Epic 21.5.3 - Advanced Features
 */

export interface MaintenancePrediction {
  id: string;
  propertyId: string;
  component: string;
  predictionType: 'preventive' | 'corrective' | 'predictive';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedFailureDate: number;
  timeToFailure: number; // days
  recommendedAction: string;
  estimatedCost: number;
  priority: 'immediate' | 'short_term' | 'long_term';
  factors: PredictionFactor[];
  historicalData: MaintenanceHistory[];
  createdAt: number;
  lastUpdated: number;
}

export interface PredictionFactor {
  name: string;
  value: number;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface MaintenanceHistory {
  date: number;
  type: 'inspection' | 'repair' | 'replacement' | 'preventive';
  component: string;
  description: string;
  cost: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  outcome: 'successful' | 'partial' | 'failed';
}

export interface MaintenanceAlert {
  id: string;
  predictionId: string;
  propertyId: string;
  alertType: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  recommendedActions: string[];
  estimatedCost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolved: boolean;
  resolvedAt?: number;
  createdAt: number;
  escalated: boolean;
}

export interface MaintenanceSchedule {
  id: string;
  propertyId: string;
  component: string;
  scheduleType: 'recurring' | 'condition_based' | 'predictive';
  frequency: number; // days
  lastPerformed: number;
  nextDue: number;
  description: string;
  estimatedDuration: number; // hours
  estimatedCost: number;
  priority: 'low' | 'medium' | 'high';
  automated: boolean;
  active: boolean;
}

export interface MaintenanceAnalytics {
  propertyId: string;
  period: {
    start: number;
    end: number;
  };
  summary: {
    totalPredictions: number;
    criticalAlerts: number;
    resolvedIssues: number;
    costSavings: number;
    preventiveMaintenanceRatio: number;
  };
  trends: {
    failureRate: number;
    maintenanceCosts: number;
    predictionAccuracy: number;
  };
  recommendations: string[];
}

class PredictiveMaintenanceService {
  private readonly API_ENDPOINT = '/api/predictive-maintenance';
  private predictionsCache = new Map<string, MaintenancePrediction[]>();
  private alertsCache = new Map<string, MaintenanceAlert[]>();
  private schedulesCache = new Map<string, MaintenanceSchedule[]>();

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadPersistedData();
      this.startAlertMonitoring();
      console.log('[Predictive Maintenance] Service initialized');
    } catch (error) {
      console.warn('[Predictive Maintenance] Initialization failed:', error);
    }
  }

  // Generate maintenance predictions for a property
  async generatePredictions(
    propertyId: string,
    propertyData: any,
    historicalData: MaintenanceHistory[] = []
  ): Promise<MaintenancePrediction[]> {
    const startTime = performance.now();

    try {
      // Analyze property components
      const components = this.identifyComponents(propertyData);

      // Generate predictions for each component
      const predictions: MaintenancePrediction[] = [];

      for (const component of components) {
        const componentPredictions = await this.predictComponentMaintenance(
          propertyId,
          component,
          propertyData,
          historicalData
        );
        predictions.push(...componentPredictions);
      }

      // Sort by priority and risk
      predictions.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const riskDiff = priorityOrder[b.riskLevel] - priorityOrder[a.riskLevel];
        if (riskDiff !== 0) return riskDiff;
        return a.timeToFailure - b.timeToFailure;
      });

      // Cache predictions
      this.predictionsCache.set(propertyId, predictions);

      // Persist predictions
      await this.persistPredictions(propertyId, predictions);

      const processingTime = performance.now() - startTime;
      console.log(`[Predictive Maintenance] Generated ${predictions.length} predictions in ${processingTime.toFixed(2)}ms`);

      return predictions;

    } catch (error) {
      console.error('[Predictive Maintenance] Prediction generation failed:', error);
      throw error;
    }
  }

  // Get predictions for a property
  getPredictions(propertyId: string): MaintenancePrediction[] {
    return this.predictionsCache.get(propertyId) || [];
  }

  // Generate maintenance alerts based on predictions
  async generateAlerts(
    propertyId: string,
    predictions: MaintenancePrediction[]
  ): Promise<MaintenanceAlert[]> {
    const alerts: MaintenanceAlert[] = [];
    const existingAlerts = this.alertsCache.get(propertyId) || [];

    for (const prediction of predictions) {
      // Check if alert already exists
      const existingAlert = existingAlerts.find(
        alert => alert.predictionId === prediction.id && !alert.resolved
      );

      if (existingAlert) {
        // Update existing alert if prediction has changed
        if (this.shouldUpdateAlert(existingAlert, prediction)) {
          const updatedAlert = this.updateAlertFromPrediction(existingAlert, prediction);
          alerts.push(updatedAlert);
        } else {
          alerts.push(existingAlert);
        }
      } else {
        // Create new alert
        const newAlert = this.createAlertFromPrediction(prediction);
        alerts.push(newAlert);
      }
    }

    // Cache and persist alerts
    this.alertsCache.set(propertyId, alerts);
    await this.persistAlerts(propertyId, alerts);

    return alerts;
  }

  // Get alerts for a property
  getAlerts(propertyId: string): MaintenanceAlert[] {
    return this.alertsCache.get(propertyId) || [];
  }

  // Acknowledge an alert
  async acknowledgeAlert(
    propertyId: string,
    alertId: string,
    userId: string
  ): Promise<MaintenanceAlert> {
    const alerts = this.alertsCache.get(propertyId) || [];
    const alertIndex = alerts.findIndex(alert => alert.id === alertId);

    if (alertIndex === -1) {
      throw new Error(`Alert ${alertId} not found`);
    }

    const alert = alerts[alertIndex];
    const updatedAlert: MaintenanceAlert = {
      ...alert,
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: Date.now()
    };

    alerts[alertIndex] = updatedAlert;
    this.alertsCache.set(propertyId, alerts);
    await this.persistAlerts(propertyId, alerts);

    return updatedAlert;
  }

  // Resolve an alert
  async resolveAlert(
    propertyId: string,
    alertId: string
  ): Promise<MaintenanceAlert> {
    const alerts = this.alertsCache.get(propertyId) || [];
    const alertIndex = alerts.findIndex(alert => alert.id === alertId);

    if (alertIndex === -1) {
      throw new Error(`Alert ${alertId} not found`);
    }

    const alert = alerts[alertIndex];
    const updatedAlert: MaintenanceAlert = {
      ...alert,
      resolved: true,
      resolvedAt: Date.now()
    };

    alerts[alertIndex] = updatedAlert;
    this.alertsCache.set(propertyId, alerts);
    await this.persistAlerts(propertyId, alerts);

    return updatedAlert;
  }

  // Create maintenance schedule
  async createSchedule(schedule: Omit<MaintenanceSchedule, 'id'>): Promise<MaintenanceSchedule> {
    const newSchedule: MaintenanceSchedule = {
      ...schedule,
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    const existingSchedules = this.schedulesCache.get(schedule.propertyId) || [];
    existingSchedules.push(newSchedule);

    this.schedulesCache.set(schedule.propertyId, existingSchedules);
    await this.persistSchedules(schedule.propertyId, existingSchedules);

    return newSchedule;
  }

  // Get maintenance schedules for a property
  getSchedules(propertyId: string): MaintenanceSchedule[] {
    return this.schedulesCache.get(propertyId) || [];
  }

  // Generate maintenance analytics
  async generateAnalytics(
    propertyId: string,
    startDate: number,
    endDate: number
  ): Promise<MaintenanceAnalytics> {
    const predictions = this.getPredictions(propertyId);
    const alerts = this.getAlerts(propertyId);
    const schedules = this.getSchedules(propertyId);

    // Filter data by date range
    const periodPredictions = predictions.filter(p =>
      p.createdAt >= startDate && p.createdAt <= endDate
    );

    const periodAlerts = alerts.filter(a =>
      a.createdAt >= startDate && a.createdAt <= endDate
    );

    // Calculate summary metrics
    const criticalAlerts = periodAlerts.filter(a => a.priority === 'critical').length;
    const resolvedIssues = periodAlerts.filter(a => a.resolved).length;

    // Calculate cost savings from preventive maintenance
    const costSavings = this.calculateCostSavings(periodPredictions, periodAlerts);

    // Calculate preventive maintenance ratio
    const preventiveMaintenanceRatio = this.calculatePreventiveRatio(schedules, periodAlerts);

    // Generate trends
    const trends = this.calculateTrends(propertyId, startDate, endDate);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      periodPredictions,
      periodAlerts,
      schedules
    );

    return {
      propertyId,
      period: { start: startDate, end: endDate },
      summary: {
        totalPredictions: periodPredictions.length,
        criticalAlerts,
        resolvedIssues,
        costSavings,
        preventiveMaintenanceRatio
      },
      trends,
      recommendations
    };
  }

  // Get service status
  getServiceStatus(): {
    totalPredictions: number;
    activeAlerts: number;
    pendingSchedules: number;
    lastUpdate: number;
  } {
    let totalPredictions = 0;
    let activeAlerts = 0;
    let pendingSchedules = 0;
    let lastUpdate = 0;

    for (const predictions of Array.from(this.predictionsCache.values())) {
      totalPredictions += predictions.length;
      const latestPrediction = predictions.reduce((latest: MaintenancePrediction, current: MaintenancePrediction) =>
        current.lastUpdated > latest.lastUpdated ? current : latest
      );
      if (latestPrediction.lastUpdated > lastUpdate) {
        lastUpdate = latestPrediction.lastUpdated;
      }
    }

    for (const alerts of Array.from(this.alertsCache.values())) {
      activeAlerts += alerts.filter((a: MaintenanceAlert) => !a.resolved).length;
    }

    for (const schedules of Array.from(this.schedulesCache.values())) {
      pendingSchedules += schedules.filter((s: MaintenanceSchedule) =>
        s.active && s.nextDue <= Date.now()
      ).length;
    }

    return {
      totalPredictions,
      activeAlerts,
      pendingSchedules,
      lastUpdate
    };
  }

  // Private methods

  private identifyComponents(propertyData: any): string[] {
    // Extract components from property data
    const components: string[] = [];

    if (propertyData.roof) components.push('roof');
    if (propertyData.walls) components.push('walls');
    if (propertyData.windows) components.push('windows');
    if (propertyData.doors) components.push('doors');
    if (propertyData.foundation) components.push('foundation');
    if (propertyData.plumbing) components.push('plumbing');
    if (propertyData.electrical) components.push('electrical');
    if (propertyData.hvac) components.push('hvac');
    if (propertyData.driveway) components.push('driveway');
    if (propertyData.pool) components.push('pool');

    return components;
  }

  private async predictComponentMaintenance(
    propertyId: string,
    component: string,
    propertyData: any,
    historicalData: MaintenanceHistory[]
  ): Promise<MaintenancePrediction[]> {
    const predictions: MaintenancePrediction[] = [];

    // Analyze historical data for this component
    const componentHistory = historicalData.filter(h => h.component === component);

    // Calculate failure probability based on historical data
    const failureProbability = this.calculateFailureProbability(componentHistory);

    // Estimate time to failure
    const timeToFailure = this.estimateTimeToFailure(component, propertyData, componentHistory);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(failureProbability, timeToFailure);

    // Generate prediction factors
    const factors = this.generatePredictionFactors(component, propertyData, componentHistory);

    // Calculate confidence
    const confidence = this.calculatePredictionConfidence(factors);

    // Generate recommended action
    const recommendedAction = this.generateRecommendedAction(component, riskLevel);

    // Estimate cost
    const estimatedCost = this.estimateMaintenanceCost(component, riskLevel);

    // Determine priority
    const priority = this.determinePriority(riskLevel, timeToFailure);

    const prediction: MaintenancePrediction = {
      id: `pred_${propertyId}_${component}_${Date.now()}`,
      propertyId,
      component,
      predictionType: 'predictive',
      confidence,
      riskLevel,
      estimatedFailureDate: Date.now() + (timeToFailure * 24 * 60 * 60 * 1000),
      timeToFailure,
      recommendedAction,
      estimatedCost,
      priority,
      factors,
      historicalData: componentHistory,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    predictions.push(prediction);

    return predictions;
  }

  private calculateFailureProbability(history: MaintenanceHistory[]): number {
    if (history.length === 0) return 0.1; // Default low probability

    const recentHistory = history.filter(h =>
      h.date > Date.now() - (365 * 24 * 60 * 60 * 1000) // Last year
    );

    const criticalIssues = recentHistory.filter(h => h.severity === 'critical').length;
    const totalIssues = recentHistory.length;

    return totalIssues > 0 ? criticalIssues / totalIssues : 0.1;
  }

  private estimateTimeToFailure(
    component: string,
    propertyData: any,
    history: MaintenanceHistory[]
  ): number {
    // Base time estimates by component (in days)
    const baseEstimates: Record<string, number> = {
      roof: 365 * 10, // 10 years
      walls: 365 * 20, // 20 years
      windows: 365 * 15, // 15 years
      doors: 365 * 15, // 15 years
      foundation: 365 * 50, // 50 years
      plumbing: 365 * 15, // 15 years
      electrical: 365 * 20, // 20 years
      hvac: 365 * 15, // 15 years
      driveway: 365 * 20, // 20 years
      pool: 365 * 10 // 10 years
    };

    let baseTime = baseEstimates[component] || 365 * 15; // Default 15 years

    // Adjust based on historical data
    if (history.length > 0) {
      const avgTimeBetweenMaintenance = this.calculateAvgTimeBetweenMaintenance(history);
      if (avgTimeBetweenMaintenance > 0) {
        baseTime = Math.min(baseTime, avgTimeBetweenMaintenance * 2);
      }
    }

    // Adjust based on property age
    if (propertyData.age) {
      const ageAdjustment = Math.max(0.5, 1 - (propertyData.age / 50)); // Older properties fail faster
      baseTime *= ageAdjustment;
    }

    return Math.max(30, Math.round(baseTime)); // Minimum 30 days
  }

  private calculateAvgTimeBetweenMaintenance(history: MaintenanceHistory[]): number {
    if (history.length < 2) return 0;

    const sortedHistory = history.sort((a, b) => a.date - b.date);
    const intervals: number[] = [];

    for (let i = 1; i < sortedHistory.length; i++) {
      const interval = (sortedHistory[i].date - sortedHistory[i - 1].date) / (24 * 60 * 60 * 1000);
      intervals.push(interval);
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  private determineRiskLevel(probability: number, timeToFailure: number): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = probability * (365 / timeToFailure); // Annual failure rate

    if (riskScore > 0.5) return 'critical';
    if (riskScore > 0.2) return 'high';
    if (riskScore > 0.1) return 'medium';
    return 'low';
  }

  private generatePredictionFactors(
    component: string,
    propertyData: any,
    history: MaintenanceHistory[]
  ): PredictionFactor[] {
    const factors: PredictionFactor[] = [];

    // Age factor
    if (propertyData.age) {
      const ageImpact = propertyData.age > 30 ? 'negative' : propertyData.age > 20 ? 'neutral' : 'positive';
      factors.push({
        name: 'Property Age',
        value: propertyData.age,
        weight: 0.3,
        impact: ageImpact,
        description: `Property is ${propertyData.age} years old`
      });
    }

    // Historical maintenance factor
    const recentMaintenance = history.filter(h =>
      h.date > Date.now() - (365 * 24 * 60 * 60 * 1000)
    ).length;

    factors.push({
      name: 'Recent Maintenance',
      value: recentMaintenance,
      weight: 0.4,
      impact: recentMaintenance > 2 ? 'positive' : recentMaintenance > 0 ? 'neutral' : 'negative',
      description: `${recentMaintenance} maintenance activities in the last year`
    });

    // Component-specific factors
    switch (component) {
      case 'roof':
        if (propertyData.roofType) {
          factors.push({
            name: 'Roof Type',
            value: 1,
            weight: 0.2,
            impact: propertyData.roofType === 'asphalt' ? 'negative' : 'positive',
            description: `${propertyData.roofType} roof type`
          });
        }
        break;
      case 'hvac':
        if (propertyData.hvacAge) {
          factors.push({
            name: 'HVAC Age',
            value: propertyData.hvacAge,
            weight: 0.3,
            impact: propertyData.hvacAge > 15 ? 'negative' : 'positive',
            description: `HVAC system is ${propertyData.hvacAge} years old`
          });
        }
        break;
    }

    return factors;
  }

  private calculatePredictionConfidence(factors: PredictionFactor[]): number {
    if (factors.length === 0) return 0.5;

    const weightedSum = factors.reduce((sum, factor) => sum + (factor.weight * factor.value), 0);
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);

    return Math.min(0.95, Math.max(0.1, weightedSum / totalWeight));
  }

  private generateRecommendedAction(component: string, riskLevel: string): string {
    const actions: Record<string, Record<string, string>> = {
      roof: {
        critical: 'Immediate roof inspection and potential replacement',
        high: 'Schedule roof inspection within 30 days',
        medium: 'Monitor roof condition and schedule maintenance',
        low: 'Continue regular maintenance schedule'
      },
      hvac: {
        critical: 'Immediate HVAC system inspection and potential replacement',
        high: 'Schedule HVAC maintenance within 14 days',
        medium: 'Schedule seasonal HVAC maintenance',
        low: 'Continue regular filter replacement and cleaning'
      }
    };

    return actions[component]?.[riskLevel] || `Schedule ${component} inspection`;
  }

  private estimateMaintenanceCost(component: string, riskLevel: string): number {
    const baseCosts: Record<string, number> = {
      roof: 15000,
      walls: 8000,
      windows: 3000,
      doors: 2000,
      foundation: 25000,
      plumbing: 5000,
      electrical: 8000,
      hvac: 6000,
      driveway: 5000,
      pool: 10000
    };

    const baseCost = baseCosts[component] || 5000;
    const riskMultiplier = { low: 0.5, medium: 0.8, high: 1.0, critical: 1.5 };

    return Math.round(baseCost * riskMultiplier[riskLevel as keyof typeof riskMultiplier]);
  }

  private determinePriority(riskLevel: string, timeToFailure: number): 'immediate' | 'short_term' | 'long_term' {
    if (riskLevel === 'critical' || timeToFailure < 30) return 'immediate';
    if (riskLevel === 'high' || timeToFailure < 90) return 'short_term';
    return 'long_term';
  }

  private shouldUpdateAlert(alert: MaintenanceAlert, prediction: MaintenancePrediction): boolean {
    return (
      alert.priority !== this.mapPredictionPriorityToAlertPriority(prediction.priority) ||
      Math.abs(alert.dueDate - prediction.estimatedFailureDate) > (24 * 60 * 60 * 1000) || // 1 day difference
      alert.estimatedCost !== prediction.estimatedCost
    );
  }

  private updateAlertFromPrediction(alert: MaintenanceAlert, prediction: MaintenancePrediction): MaintenanceAlert {
    return {
      ...alert,
      priority: this.mapPredictionPriorityToAlertPriority(prediction.priority),
      dueDate: prediction.estimatedFailureDate,
      estimatedCost: prediction.estimatedCost,
      message: this.generateAlertMessage(prediction)
    };
  }

  private createAlertFromPrediction(prediction: MaintenancePrediction): MaintenanceAlert {
    return {
      id: `alert_${prediction.id}`,
      predictionId: prediction.id,
      propertyId: prediction.propertyId,
      alertType: prediction.riskLevel === 'critical' ? 'critical' : 'warning',
      title: `${prediction.component} Maintenance Alert`,
      message: this.generateAlertMessage(prediction),
      recommendedActions: [prediction.recommendedAction],
      estimatedCost: prediction.estimatedCost,
      priority: this.mapPredictionPriorityToAlertPriority(prediction.priority),
      dueDate: prediction.estimatedFailureDate,
      acknowledged: false,
      resolved: false,
      createdAt: Date.now(),
      escalated: false
    };
  }

  private generateAlertMessage(prediction: MaintenancePrediction): string {
    const timeFrame = prediction.timeToFailure < 30 ? 'immediately' :
                     prediction.timeToFailure < 90 ? 'within the next month' :
                     'in the coming months';

    return `${prediction.component} requires attention ${timeFrame}. ${prediction.recommendedAction}. Estimated cost: $${prediction.estimatedCost}.`;
  }

  private calculateCostSavings(predictions: MaintenancePrediction[], alerts: MaintenanceAlert[]): number {
    // Estimate cost savings from preventive maintenance
    const preventiveAlerts = alerts.filter(a => a.priority === 'low' || a.priority === 'medium');
    const estimatedSavings = preventiveAlerts.reduce((sum, alert) => {
      // Assume preventive maintenance saves 30-50% of corrective costs
      return sum + (alert.estimatedCost * 0.4);
    }, 0);

    return Math.round(estimatedSavings);
  }

  private calculatePreventiveRatio(schedules: MaintenanceSchedule[], alerts: MaintenanceAlert[]): number {
    const preventiveSchedules = schedules.filter(s => s.scheduleType === 'recurring').length;
    const totalSchedules = schedules.length;

    return totalSchedules > 0 ? preventiveSchedules / totalSchedules : 0;
  }

  private calculateTrends(propertyId: string, startDate: number, endDate: number): MaintenanceAnalytics['trends'] {
    // Calculate trends over the period
    const predictions = this.getPredictions(propertyId);
    const alerts = this.getAlerts(propertyId);

    const periodPredictions = predictions.filter(p =>
      p.createdAt >= startDate && p.createdAt <= endDate
    );

    const periodAlerts = alerts.filter(a =>
      a.createdAt >= startDate && a.createdAt <= endDate
    );

    // Simple trend calculations
    const failureRate = periodAlerts.length / ((endDate - startDate) / (30 * 24 * 60 * 60 * 1000)); // per month
    const maintenanceCosts = periodAlerts.reduce((sum, alert) => sum + alert.estimatedCost, 0);
    const predictionAccuracy = periodPredictions.length > 0 ?
      periodPredictions.filter(p => p.confidence > 0.8).length / periodPredictions.length : 0;

    return {
      failureRate,
      maintenanceCosts,
      predictionAccuracy
    };
  }

  private generateRecommendations(
    predictions: MaintenancePrediction[],
    alerts: MaintenanceAlert[],
    schedules: MaintenanceSchedule[]
  ): string[] {
    const recommendations: string[] = [];

    // Analyze prediction patterns
    const criticalPredictions = predictions.filter(p => p.riskLevel === 'critical');
    if (criticalPredictions.length > 3) {
      recommendations.push('Consider comprehensive property inspection due to multiple critical issues');
    }

    // Analyze alert response times
    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
    if (unacknowledgedAlerts.length > 5) {
      recommendations.push('Improve alert acknowledgment process to prevent escalation');
    }

    // Analyze maintenance scheduling
    const overdueSchedules = schedules.filter(s => s.nextDue < Date.now());
    if (overdueSchedules.length > 0) {
      recommendations.push(`Schedule ${overdueSchedules.length} overdue maintenance activities`);
    }

    // Cost optimization recommendations
    const highCostAlerts = alerts.filter(a => a.estimatedCost > 10000);
    if (highCostAlerts.length > 0) {
      recommendations.push('Consider bundling high-cost maintenance activities for cost optimization');
    }

    return recommendations;
  }

  private mapPredictionPriorityToAlertPriority(
    predictionPriority: MaintenancePrediction['priority']
  ): MaintenanceAlert['priority'] {
    const mapping: Record<MaintenancePrediction['priority'], MaintenanceAlert['priority']> = {
      immediate: 'critical',
      short_term: 'high',
      long_term: 'medium'
    };
    return mapping[predictionPriority] || 'medium';
  }

  private startAlertMonitoring(): void {
    // Check for overdue alerts every hour
    setInterval(() => {
      this.checkOverdueAlerts();
    }, 60 * 60 * 1000); // 1 hour
  }

  private checkOverdueAlerts(): void {
    const now = Date.now();
    const overdueThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [propertyId, alerts] of Array.from(this.alertsCache.entries())) {
      const overdueAlerts = alerts.filter((alert: MaintenanceAlert) =>
        !alert.resolved &&
        !alert.acknowledged &&
        (now - alert.createdAt) > overdueThreshold
      );

      if (overdueAlerts.length > 0) {
        console.warn(`[Predictive Maintenance] ${overdueAlerts.length} overdue alerts for property ${propertyId}`);
        // Could trigger escalation process here
      }
    }
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const predictionsData = localStorage.getItem('maintenance_predictions');
      const alertsData = localStorage.getItem('maintenance_alerts');
      const schedulesData = localStorage.getItem('maintenance_schedules');

      if (predictionsData) {
        const parsed = JSON.parse(predictionsData);
        Object.entries(parsed).forEach(([propertyId, predictions]) => {
          this.predictionsCache.set(propertyId, predictions as MaintenancePrediction[]);
        });
      }

      if (alertsData) {
        const parsed = JSON.parse(alertsData);
        Object.entries(parsed).forEach(([propertyId, alerts]) => {
          this.alertsCache.set(propertyId, alerts as MaintenanceAlert[]);
        });
      }

      if (schedulesData) {
        const parsed = JSON.parse(schedulesData);
        Object.entries(parsed).forEach(([propertyId, schedules]) => {
          this.schedulesCache.set(propertyId, schedules as MaintenanceSchedule[]);
        });
      }
    } catch (error) {
      console.warn('[Predictive Maintenance] Failed to load persisted data:', error);
    }
  }

  private async persistPredictions(propertyId: string, predictions: MaintenancePrediction[]): Promise<void> {
    try {
      const allPredictions = Object.fromEntries(this.predictionsCache.entries());
      localStorage.setItem('maintenance_predictions', JSON.stringify(allPredictions));
    } catch (error) {
      console.warn('[Predictive Maintenance] Failed to persist predictions:', error);
    }
  }

  private async persistAlerts(propertyId: string, alerts: MaintenanceAlert[]): Promise<void> {
    try {
      const allAlerts = Object.fromEntries(this.alertsCache.entries());
      localStorage.setItem('maintenance_alerts', JSON.stringify(allAlerts));
    } catch (error) {
      console.warn('[Predictive Maintenance] Failed to persist alerts:', error);
    }
  }

  private async persistSchedules(propertyId: string, schedules: MaintenanceSchedule[]): Promise<void> {
    try {
      const allSchedules = Object.fromEntries(this.schedulesCache.entries());
      localStorage.setItem('maintenance_schedules', JSON.stringify(allSchedules));
    } catch (error) {
      console.warn('[Predictive Maintenance] Failed to persist schedules:', error);
    }
  }
  // Create work order from prediction
  async createWorkOrderFromPrediction(predictionId: string): Promise<any> {
    try {
      // Call API to create work order
      const response = await fetch(`${this.API_ENDPOINT}/workorders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ predictionId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create work order: ${response.statusText}`);
      }

      const workOrder = await response.json();
      console.log('[Predictive Maintenance] Work order created:', workOrder);

      // Update alert status if associated
      const alerts = this.alertsCache.get(workOrder.propertyId) || [];
      const alertIndex = alerts.findIndex(alert => alert.predictionId === predictionId);
      if (alertIndex !== -1) {
        alerts[alertIndex].resolved = true;
        alerts[alertIndex].resolvedAt = Date.now();
        this.alertsCache.set(workOrder.propertyId, alerts);
        await this.persistAlerts(workOrder.propertyId, alerts);
      }

      return workOrder;
    } catch (error) {
      console.error('[Predictive Maintenance] Failed to create work order:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const predictiveMaintenanceService = new PredictiveMaintenanceService();
export default predictiveMaintenanceService;
