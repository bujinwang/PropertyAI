/**
 * Real-time Alert System Types for PropertyAI
 */

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'maintenance' | 'financial' | 'risk' | 'trend' | 'emergency' | 'system';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface AlertTrigger {
  id: string;
  name: string;
  type: AlertType;
  severity: AlertSeverity;
  condition: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    duration?: number; // minutes
  };
  enabled: boolean;
  cooldownPeriod?: number; // minutes between alerts
  notificationChannels: NotificationChannel[];
}

export interface NotificationChannel {
  type: 'websocket' | 'push' | 'email' | 'sms';
  enabled: boolean;
  config?: {
    quietHours?: {
      start: string; // HH:MM
      end: string; // HH:MM
      timezone: string;
    };
    priority?: AlertSeverity[];
  };
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  description: string;
  propertyId: string;
  propertyName?: string;
  component?: string;
  metrics: Record<string, any>;
  recommendations: string[];
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  source: 'analytics' | 'monitoring' | 'manual' | 'system';
  tags: string[];
  metadata: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  triggers: AlertTrigger[];
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  channel: NotificationChannel['type'];
  recipient: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  metadata: Record<string, any>;
}

export interface AlertDashboard {
  activeAlerts: Alert[];
  alertSummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recentAlerts: Alert[];
  alertTrends: {
    period: string;
    alertsByType: Record<AlertType, number>;
    alertsBySeverity: Record<AlertSeverity, number>;
  };
  topAlertSources: Array<{
    propertyId: string;
    propertyName: string;
    alertCount: number;
    criticalCount: number;
  }>;
}

export interface AlertConfiguration {
  userId: string;
  globalSettings: {
    enabled: boolean;
    quietHours: {
      start: string;
      end: string;
      timezone: string;
    };
    maxAlertsPerHour: number;
  };
  channelSettings: Record<NotificationChannel['type'], {
    enabled: boolean;
    priorityFilter: AlertSeverity[];
    quietHoursOverride?: {
      start: string;
      end: string;
      timezone: string;
    };
  }>;
  propertyFilters: string[]; // property IDs to monitor
  alertTypeFilters: AlertType[];
  customRules: AlertRule[];
}

export interface AlertAnalytics {
  alertId: string;
  responseTime?: number; // minutes from creation to acknowledgment
  resolutionTime?: number; // minutes from creation to resolution
  escalationCount: number;
  notificationCount: number;
  effectiveness: {
    acknowledged: boolean;
    resolved: boolean;
    falsePositive: boolean;
    userFeedback?: string;
  };
  metadata: Record<string, any>;
}

// WebSocket message types for real-time alerts
export interface AlertWebSocketMessage {
  type: 'alert_created' | 'alert_updated' | 'alert_acknowledged' | 'alert_resolved' | 'alert_dismissed';
  data: Alert;
  timestamp: Date;
}

// Push notification payload for alerts
export interface AlertPushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data: {
    alertId: string;
    type: AlertType;
    severity: AlertSeverity;
    propertyId: string;
    timestamp: string;
    url?: string;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  tag?: string;
}

// Alert generation context
export interface AlertGenerationContext {
  propertyId: string;
  propertyName?: string;
  analyticsResult?: any;
  trigger?: AlertTrigger;
  source: Alert['source'];
  metadata?: Record<string, any>;
}

// Alert escalation rules
export interface AlertEscalationRule {
  id: string;
  name: string;
  conditions: {
    severity: AlertSeverity;
    unacknowledgedDuration: number; // minutes
    escalationLevel: number;
  };
  actions: {
    notifyUsers: string[]; // user IDs
    channels: NotificationChannel['type'][];
    priority: 'normal' | 'urgent' | 'critical';
  };
  enabled: boolean;
}

// Alert templates for consistent messaging
export interface AlertTemplate {
  type: AlertType;
  severity: AlertSeverity;
  titleTemplate: string;
  messageTemplate: string;
  descriptionTemplate: string;
  recommendations: string[];
  variables: string[]; // template variables like {{propertyName}}, {{metric}}, etc.
}

// Maintenance-specific alert types
export interface MaintenanceAlert extends Alert {
  type: 'maintenance';
  component: string;
  failureProbability: number;
  timeToFailure: number;
  costImpact: {
    repairCost: number;
    downtimeCost: number;
    totalCost: number;
  };
}

// Financial-specific alert types
export interface FinancialAlert extends Alert {
  type: 'financial';
  metric: string;
  currentValue: number;
  threshold: number;
  impact: number;
  projection: number[];
}

// Risk-specific alert types
export interface RiskAlert extends Alert {
  type: 'risk';
  riskFactors: string[];
  mitigationStrategies: string[];
  confidence: number;
}

// Trend-specific alert types
export interface TrendAlert extends Alert {
  type: 'trend';
  trend: 'improving' | 'stable' | 'declining';
  rate: number;
  forecast: number[];
  insights: string[];
}