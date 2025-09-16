/**
 * Real-Time Alert Service for PropertyAI
 *
 * Comprehensive alert system that monitors property analytics and delivers
 * real-time notifications through multiple channels (WebSocket, Push, Email, SMS)
 */

import { PredictiveAnalyticsEngine } from './predictiveAnalyticsEngine';
import { pushNotificationService, PushNotificationPayload } from './pushNotificationService';
import { emergencyWebSocketService } from './websocketService';
import { sendNotification } from './NotificationService';
import {
  Alert,
  AlertTrigger,
  AlertRule,
  AlertType,
  AlertSeverity,
  AlertStatus,
  AlertConfiguration,
  AlertGenerationContext,
  AlertWebSocketMessage,
  AlertPushNotification,
  AlertTemplate,
  MaintenanceAlert,
  FinancialAlert,
  RiskAlert,
  TrendAlert,
  AlertAnalytics
} from '../types/alerts';

export interface AlertServiceConfig {
  pollingInterval: number; // milliseconds
  maxAlertsPerProperty: number;
  alertRetentionDays: number;
  enableAutoResolution: boolean;
  escalationEnabled: boolean;
}

export class RealTimeAlertService {
  private static instance: RealTimeAlertService;
  private analyticsEngine: PredictiveAnalyticsEngine;
  private config: AlertServiceConfig;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private userConfigurations: Map<string, AlertConfiguration> = new Map();
  private alertTemplates: Map<string, AlertTemplate> = new Map();
  private pollingTimer: NodeJS.Timeout | null = null;
  private lastAnalyticsCheck: Map<string, Date> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();

  constructor(config: Partial<AlertServiceConfig> = {}) {
    this.config = {
      pollingInterval: 30000, // 30 seconds
      maxAlertsPerProperty: 10,
      alertRetentionDays: 30,
      enableAutoResolution: true,
      escalationEnabled: true,
      ...config,
    };

    this.analyticsEngine = new PredictiveAnalyticsEngine();
    this.initializeDefaultRules();
    this.initializeDefaultTemplates();
    this.startMonitoring();
  }

  public static getInstance(): RealTimeAlertService {
    if (!RealTimeAlertService.instance) {
      RealTimeAlertService.instance = new RealTimeAlertService();
    }
    return RealTimeAlertService.instance;
  }

  /**
   * Initialize default alert rules for common scenarios
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'maintenance-critical',
        name: 'Critical Maintenance Alert',
        description: 'Alert when maintenance failure probability exceeds 80%',
        enabled: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        triggers: [{
          id: 'maintenance-failure-probability',
          name: 'High Failure Probability',
          type: 'maintenance',
          severity: 'critical',
          condition: {
            metric: 'failureProbability',
            operator: '>',
            threshold: 0.8,
            duration: 5, // 5 minutes
          },
          enabled: true,
          cooldownPeriod: 60, // 1 hour
          notificationChannels: [
            { type: 'websocket', enabled: true },
            { type: 'push', enabled: true },
            { type: 'email', enabled: true },
          ],
        }],
      },
      {
        id: 'financial-value-drop',
        name: 'Property Value Decline Alert',
        description: 'Alert when property value drops significantly',
        enabled: true,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        triggers: [{
          id: 'value-decline-threshold',
          name: 'Value Decline Threshold',
          type: 'financial',
          severity: 'high',
          condition: {
            metric: 'valueDecline',
            operator: '>',
            threshold: 0.05, // 5% decline
            duration: 1440, // 24 hours
          },
          enabled: true,
          cooldownPeriod: 1440, // 24 hours
          notificationChannels: [
            { type: 'websocket', enabled: true },
            { type: 'email', enabled: true },
          ],
        }],
      },
      {
        id: 'risk-critical-threshold',
        name: 'Critical Risk Alert',
        description: 'Alert when overall risk reaches critical level',
        enabled: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        triggers: [{
          id: 'overall-risk-critical',
          name: 'Critical Risk Level',
          type: 'risk',
          severity: 'critical',
          condition: {
            metric: 'overallRisk',
            operator: '==',
            threshold: 4, // critical = 4
          },
          enabled: true,
          cooldownPeriod: 30, // 30 minutes
          notificationChannels: [
            { type: 'websocket', enabled: true },
            { type: 'push', enabled: true },
            { type: 'sms', enabled: true },
          ],
        }],
      },
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Initialize default alert templates for consistent messaging
   */
  private initializeDefaultTemplates(): void {
    const templates: AlertTemplate[] = [
      {
        type: 'maintenance',
        severity: 'critical',
        titleTemplate: '🚨 Critical Maintenance Required: {{component}}',
        messageTemplate: '{{component}} at {{propertyName}} has {{failureProbability}}% failure probability',
        descriptionTemplate: 'The {{component}} requires immediate attention. Expected failure within {{timeToFailure}} days. Estimated repair cost: ${{repairCost}}',
        recommendations: [
          'Schedule immediate inspection',
          'Plan maintenance within 24 hours',
          'Budget ${{repairCost}} for repairs',
          'Monitor component closely',
        ],
        variables: ['component', 'propertyName', 'failureProbability', 'timeToFailure', 'repairCost'],
      },
      {
        type: 'financial',
        severity: 'high',
        titleTemplate: '📉 Property Value Decline: {{propertyName}}',
        messageTemplate: 'Property value decreased by {{declinePercent}}% in the last 24 hours',
        descriptionTemplate: 'Property value has declined from ${{previousValue}} to ${{currentValue}}, representing a {{declinePercent}}% decrease. This may impact ROI projections.',
        recommendations: [
          'Review recent market conditions',
          'Assess property maintenance needs',
          'Consider renovation opportunities',
          'Monitor market trends closely',
        ],
        variables: ['propertyName', 'declinePercent', 'previousValue', 'currentValue'],
      },
      {
        type: 'risk',
        severity: 'critical',
        titleTemplate: '⚠️ Critical Risk Alert: {{propertyName}}',
        messageTemplate: 'Property risk level has reached CRITICAL status',
        descriptionTemplate: 'Multiple risk factors have elevated the property to critical risk status. Immediate action required to mitigate potential issues.',
        recommendations: [
          'Conduct immediate property inspection',
          'Address high-priority maintenance items',
          'Review risk mitigation strategies',
          'Implement monitoring enhancements',
        ],
        variables: ['propertyName'],
      },
    ];

    templates.forEach(template => {
      const key = `${template.type}-${template.severity}`;
      this.alertTemplates.set(key, template);
    });
  }

  /**
   * Start the real-time monitoring process
   */
  private startMonitoring(): void {
    console.log('Real-Time Alert Service: Starting monitoring...');

    // Connect to WebSocket for real-time updates
    emergencyWebSocketService.connect().catch((error: any) => {
      console.error('Failed to connect WebSocket for alerts:', error);
    });

    // Start polling for analytics updates
    this.pollingTimer = setInterval(() => {
      this.checkAnalyticsForAlerts();
    }, this.config.pollingInterval);

    // Subscribe to analytics updates via WebSocket
    emergencyWebSocketService.subscribe('analytics_updated', (data: any) => {
      this.processAnalyticsUpdate(data);
    });

    console.log('Real-Time Alert Service: Monitoring started');
  }

  /**
   * Stop the monitoring process
   */
  public stopMonitoring(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    emergencyWebSocketService.disconnect();
    console.log('Real-Time Alert Service: Monitoring stopped');
  }

  /**
   * Check analytics for potential alerts
   */
  private async checkAnalyticsForAlerts(): Promise<void> {
    try {
      // Get all properties that need monitoring
      const propertiesToMonitor = await this.getPropertiesToMonitor();

      for (const propertyId of propertiesToMonitor) {
        const lastCheck = this.lastAnalyticsCheck.get(propertyId);
        const now = new Date();

        // Skip if checked recently (within polling interval)
        if (lastCheck && (now.getTime() - lastCheck.getTime()) < this.config.pollingInterval) {
          continue;
        }

        // Get property data for analytics (simplified - would need actual data fetching)
        const propertyData = await this.getPropertyData(propertyId);
        const maintenanceHistory = await this.getMaintenanceHistory(propertyId);
        const marketData = await this.getMarketData(propertyId);

        // Get analytics for this property
        const analytics = await this.analyticsEngine.generatePortfolioAnalytics(
          [propertyData],
          maintenanceHistory,
          marketData
        );

        if (analytics) {
          await this.processAnalyticsForAlerts(analytics, propertyId);
        }

        this.lastAnalyticsCheck.set(propertyId, now);
      }
    } catch (error) {
      console.error('Error checking analytics for alerts:', error);
    }
  }

  /**
   * Process analytics update from WebSocket
   */
  private async processAnalyticsUpdate(data: any): Promise<void> {
    try {
      const { propertyId, analytics } = data;
      await this.processAnalyticsForAlerts(analytics, propertyId);
    } catch (error) {
      console.error('Error processing analytics update:', error);
    }
  }

  /**
   * Process analytics data to generate alerts
   */
  private async processAnalyticsForAlerts(analytics: any, propertyId: string): Promise<void> {
    const propertyName = await this.getPropertyName(propertyId);

    // Check each alert rule
    for (const rule of Array.from(this.alertRules.values())) {
      if (!rule.enabled) continue;

      for (const trigger of rule.triggers) {
        if (!trigger.enabled) continue;

        // Check cooldown period
        const cooldownKey = `${propertyId}-${trigger.id}`;
        const lastAlert = this.alertCooldowns.get(cooldownKey);
        if (lastAlert && trigger.cooldownPeriod) {
          const cooldownEnd = new Date(lastAlert.getTime() + trigger.cooldownPeriod * 60000);
          if (new Date() < cooldownEnd) continue;
        }

        // Evaluate trigger condition
        const shouldTrigger = this.evaluateTriggerCondition(trigger, analytics);

        if (shouldTrigger) {
          await this.generateAlert(trigger, {
            propertyId,
            propertyName,
            analyticsResult: analytics,
            trigger,
            source: 'analytics',
          });

          // Set cooldown
          this.alertCooldowns.set(cooldownKey, new Date());
        }
      }
    }
  }

  /**
   * Evaluate if a trigger condition is met
   */
  private evaluateTriggerCondition(trigger: AlertTrigger, analytics: any): boolean {
    const { condition } = trigger;
    let metricValue: number;

    // Extract metric value based on trigger type
    switch (trigger.type) {
      case 'maintenance':
        if (condition.metric === 'failureProbability') {
          // Find the highest failure probability across all components
          const maxFailureProb = Math.max(
            ...analytics.predictiveMaintenance.map((pm: any) => pm.failureProbability)
          );
          metricValue = maxFailureProb;
        } else {
          return false;
        }
        break;

      case 'financial':
        if (condition.metric === 'valueDecline') {
          // Calculate value decline from trend analysis
          const currentValue = analytics.financialImpact.currentValue;
          const predictedValue = analytics.financialImpact.predictedValue;
          metricValue = (currentValue - predictedValue) / currentValue;
        } else {
          return false;
        }
        break;

      case 'risk':
        if (condition.metric === 'overallRisk') {
          // Map risk level to numeric value
          const riskLevels: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
          const riskLevel = analytics.riskAssessment?.overallRisk || 'low';
          metricValue = riskLevels[riskLevel] || 1;
        } else {
          return false;
        }
        break;

      default:
        return false;
    }

    // Evaluate condition
    switch (condition.operator) {
      case '>': return metricValue > condition.threshold;
      case '<': return metricValue < condition.threshold;
      case '>=': return metricValue >= condition.threshold;
      case '<=': return metricValue <= condition.threshold;
      case '==': return metricValue === condition.threshold;
      case '!=': return metricValue !== condition.threshold;
      default: return false;
    }
  }

  /**
   * Generate an alert from a trigger
   */
  private async generateAlert(trigger: AlertTrigger, context: AlertGenerationContext): Promise<void> {
    const template = this.alertTemplates.get(`${trigger.type}-${trigger.severity}`);
    if (!template) {
      console.warn(`No template found for ${trigger.type}-${trigger.severity}`);
      return;
    }

    // Check if we already have an active alert for this trigger and property
    const existingAlertId = `${context.propertyId}-${trigger.id}`;
    if (this.activeAlerts.has(existingAlertId)) {
      return; // Alert already exists
    }

    // Generate alert content using template
    const alertData = this.generateAlertContent(template, trigger, context);

    const alert: Alert = {
      id: existingAlertId,
      type: trigger.type,
      severity: trigger.severity,
      title: alertData.title,
      message: alertData.message,
      description: alertData.description,
      propertyId: context.propertyId,
      propertyName: context.propertyName,
      component: alertData.component,
      metrics: alertData.metrics,
      recommendations: template.recommendations,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      source: context.source,
      tags: [trigger.type, trigger.severity, 'auto-generated'],
      metadata: {
        triggerId: trigger.id,
        ruleId: trigger.id.split('-')[0], // Extract rule ID from trigger ID
        analyticsTimestamp: context.analyticsResult?.timestamp,
        ...context.metadata,
      },
    };

    // Store alert
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    // Send notifications
    await this.sendAlertNotifications(alert, trigger.notificationChannels);

    // Broadcast via WebSocket
    this.broadcastAlert(alert, 'alert_created');

    console.log(`Alert generated: ${alert.title} (${alert.severity})`);
  }

  /**
   * Generate alert content using template
   */
  private generateAlertContent(template: AlertTemplate, trigger: AlertTrigger, context: AlertGenerationContext): any {
    const { analyticsResult } = context;

    // Extract variables for template
    const variables: Record<string, any> = {
      propertyName: context.propertyName || 'Unknown Property',
      component: 'Unknown Component',
      failureProbability: 0,
      timeToFailure: 0,
      repairCost: 0,
      declinePercent: 0,
      previousValue: 0,
      currentValue: 0,
    };

    // Populate variables based on analytics data
    if (analyticsResult) {
      if (trigger.type === 'maintenance' && analyticsResult.predictiveMaintenance?.length > 0) {
        // Find the component with highest failure probability
        const criticalComponent = analyticsResult.predictiveMaintenance.reduce((max: any, current: any) =>
          current.failureProbability > max.failureProbability ? current : max
        );

        variables.component = criticalComponent.component;
        variables.failureProbability = Math.round(criticalComponent.failureProbability * 100);
        variables.timeToFailure = Math.round(criticalComponent.timeToFailure);
        variables.repairCost = criticalComponent.costImpact?.repairCost || 0;
      }

      if (trigger.type === 'financial') {
        const currentValue = analyticsResult.financialImpact?.currentValue || 0;
        const predictedValue = analyticsResult.financialImpact?.predictedValue || 0;
        variables.declinePercent = Math.round(Math.abs((currentValue - predictedValue) / currentValue) * 100);
        variables.previousValue = currentValue;
        variables.currentValue = predictedValue;
      }
    }

    // Replace template variables
    const replaceVariables = (template: string): string => {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key]?.toString() || match;
      });
    };

    return {
      title: replaceVariables(template.titleTemplate),
      message: replaceVariables(template.messageTemplate),
      description: replaceVariables(template.descriptionTemplate),
      component: variables.component,
      metrics: variables,
    };
  }

  /**
   * Send alert notifications through configured channels
   */
  private async sendAlertNotifications(alert: Alert, channels: any[]): Promise<void> {
    for (const channel of channels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
          case 'websocket':
            // Already handled by broadcastAlert
            break;

          case 'push':
            await this.sendPushNotification(alert);
            break;

          case 'email':
            await this.sendEmailNotification(alert);
            break;

          case 'sms':
            await this.sendSMSNotification(alert);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel.type} notification for alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(alert: Alert): Promise<void> {
    // Map our alert types to emergency alert types expected by push service
    const typeMapping: Record<AlertType, 'maintenance' | 'fire' | 'medical' | 'security' | 'weather' | 'other'> = {
      maintenance: 'maintenance',
      financial: 'other',
      risk: 'security',
      trend: 'other',
      emergency: 'other',
      system: 'other',
    };

    const payload: PushNotificationPayload = {
      title: alert.title,
      body: alert.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        alertId: alert.id,
        type: typeMapping[alert.type] || 'other',
        priority: alert.severity,
        url: `/alerts/${alert.id}`,
        timestamp: alert.createdAt.toISOString(),
      },
      actions: [
        {
          action: 'view-alert',
          title: 'View Alert',
        },
        {
          action: 'acknowledge',
          title: 'Acknowledge',
        },
      ],
      requireInteraction: alert.severity === 'critical',
      vibrate: alert.severity === 'critical' ? [200, 100, 200, 100, 200] : [100, 50, 100],
      tag: `alert-${alert.id}`,
    };

    // Send to all subscribed users (this would be enhanced with user targeting)
    await pushNotificationService.sendTestNotification();
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert): Promise<void> {
    const recipient = 'property-manager@company.com'; // This would be dynamic
    const subject = `PropertyAI Alert: ${alert.title}`;
    const body = `
PropertyAI Alert Notification

${alert.title}
${alert.message}

Property: ${alert.propertyName || alert.propertyId}
Severity: ${alert.severity.toUpperCase()}
Type: ${alert.type}

Description:
${alert.description}

Recommendations:
${alert.recommendations.map(rec => `- ${rec}`).join('\n')}

View Alert: https://app.propertyai.com/alerts/${alert.id}

This is an automated notification from PropertyAI.
    `.trim();

    await sendNotification(recipient, 'email', body);
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(alert: Alert): Promise<void> {
    const recipient = '+1234567890'; // This would be dynamic
    const message = `PropertyAI Alert: ${alert.title} - ${alert.propertyName || alert.propertyId} (${alert.severity.toUpperCase()})`;

    await sendNotification(recipient, 'sms', message);
  }

  /**
   * Broadcast alert via WebSocket
   */
  private broadcastAlert(alert: Alert, eventType: AlertWebSocketMessage['type']): void {
    const message: AlertWebSocketMessage = {
      type: eventType,
      data: alert,
      timestamp: new Date(),
    };

    emergencyWebSocketService.send(message);
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();
    alert.updatedAt = new Date();

    this.broadcastAlert(alert, 'alert_acknowledged');
  }

  /**
   * Resolve an alert
   */
  public async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.updatedAt = new Date();

    this.activeAlerts.delete(alertId);
    this.broadcastAlert(alert, 'alert_resolved');
  }

  /**
   * Dismiss an alert
   */
  public async dismissAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'dismissed';
    alert.updatedAt = new Date();

    this.activeAlerts.delete(alertId);
    this.broadcastAlert(alert, 'alert_dismissed');
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alerts for a specific property
   */
  public getAlertsForProperty(propertyId: string): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => alert.propertyId === propertyId);
  }

  /**
   * Get alert history
   */
  public getAlertHistory(limit: number = 50): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Configure user alert preferences
   */
  public setUserConfiguration(userId: string, config: AlertConfiguration): void {
    this.userConfigurations.set(userId, config);
  }

  /**
   * Get user alert configuration
   */
  public getUserConfiguration(userId: string): AlertConfiguration | undefined {
    return this.userConfigurations.get(userId);
  }

  /**
   * Add custom alert rule
   */
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  /**
   * Remove alert rule
   */
  public removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
  }

  /**
   * Get all alert rules
   */
  public getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Helper method to get properties to monitor
   */
  private async getPropertiesToMonitor(): Promise<string[]> {
    // This would typically query the database for all active properties
    // For now, return a sample list
    return ['prop-001', 'prop-002', 'prop-003'];
  }

  /**
   * Helper method to get property name
   */
  private async getPropertyName(propertyId: string): Promise<string> {
    // This would typically query the database for property details
    // For now, return a formatted name
    return `Property ${propertyId.split('-')[1]}`;
  }

  /**
   * Helper method to get property data
   */
  private async getPropertyData(propertyId: string): Promise<any> {
    // This would typically query the database for property details
    // For now, return mock data
    return {
      id: propertyId,
      address: `${propertyId} Main St`,
      purchasePrice: 300000,
      yearBuilt: 2010,
      squareFeet: 2000,
      bedrooms: 3,
      bathrooms: 2,
    };
  }

  /**
   * Helper method to get maintenance history
   */
  private async getMaintenanceHistory(propertyId: string): Promise<any[]> {
    // This would typically query the database for maintenance records
    // For now, return mock data
    return [
      {
        id: 'maint-001',
        propertyId,
        component: 'roof',
        description: 'Roof repair',
        cost: 2500,
        date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
      },
      {
        id: 'maint-002',
        propertyId,
        component: 'hvac',
        description: 'HVAC maintenance',
        cost: 800,
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
      },
    ];
  }

  /**
   * Helper method to get market data
   */
  private async getMarketData(propertyId: string): Promise<any[]> {
    // This would typically query the database for market data
    // For now, return mock data
    return [
      {
        id: 'market-001',
        date: new Date(),
        averagePrice: 350000,
        pricePerSqFt: 175,
        marketTrend: 'stable',
      },
    ];
  }

  /**
   * Clean up old alerts based on retention policy
   */
  private cleanupOldAlerts(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.alertRetentionDays);

    this.alertHistory = this.alertHistory.filter(alert => alert.createdAt > cutoffDate);
  }

  /**
   * Get alert statistics
   */
  public getAlertStatistics(): {
    totalActive: number;
    byType: Record<AlertType, number>;
    bySeverity: Record<AlertSeverity, number>;
    recentActivity: number;
  } {
    const activeAlerts = this.getActiveAlerts();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const byType = activeAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<AlertType, number>);

    const bySeverity = activeAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    const recentActivity = this.alertHistory.filter(alert => alert.createdAt > last24Hours).length;

    return {
      totalActive: activeAlerts.length,
      byType,
      bySeverity,
      recentActivity,
    };
  }
}

// Export singleton instance
export const realTimeAlertService = RealTimeAlertService.getInstance();