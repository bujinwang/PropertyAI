/**
 * React hook for using the Real-Time Alert Service
 *
 * Provides easy access to alert functionality in React components
 */

import { useState, useEffect, useCallback } from 'react';
import { realTimeAlertService } from '../services/realTimeAlertService';
import { Alert, AlertType, AlertSeverity, AlertStatus } from '../types/alerts';

export interface UseAlertServiceReturn {
  // Alert data
  activeAlerts: Alert[];
  alertsForProperty: (propertyId: string) => Alert[];
  alertHistory: Alert[];

  // Alert actions
  acknowledgeAlert: (alertId: string, userId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;

  // Alert filtering
  getAlertsByType: (type: AlertType) => Alert[];
  getAlertsBySeverity: (severity: AlertSeverity) => Alert[];
  getAlertsByStatus: (status: AlertStatus) => Alert[];

  // Statistics
  alertStats: {
    totalActive: number;
    byType: Record<AlertType, number>;
    bySeverity: Record<AlertSeverity, number>;
    recentActivity: number;
  };

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Service control
  refreshAlerts: () => void;
}

export const useAlertService = (): UseAlertServiceReturn => {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [alertHistory, setAlertHistory] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const alerts = realTimeAlertService.getActiveAlerts();
      const history = realTimeAlertService.getAlertHistory(50);

      setActiveAlerts(alerts);
      setAlertHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh alerts
  const refreshAlerts = useCallback(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Alert actions
  const acknowledgeAlert = useCallback(async (alertId: string, userId: string) => {
    try {
      await realTimeAlertService.acknowledgeAlert(alertId, userId);
      refreshAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alert');
    }
  }, [refreshAlerts]);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await realTimeAlertService.resolveAlert(alertId);
      refreshAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve alert');
    }
  }, [refreshAlerts]);

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      await realTimeAlertService.dismissAlert(alertId);
      refreshAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss alert');
    }
  }, [refreshAlerts]);

  // Filtering functions
  const alertsForProperty = useCallback((propertyId: string) => {
    return realTimeAlertService.getAlertsForProperty(propertyId);
  }, []);

  const getAlertsByType = useCallback((type: AlertType) => {
    return activeAlerts.filter(alert => alert.type === type);
  }, [activeAlerts]);

  const getAlertsBySeverity = useCallback((severity: AlertSeverity) => {
    return activeAlerts.filter(alert => alert.severity === severity);
  }, [activeAlerts]);

  const getAlertsByStatus = useCallback((status: AlertStatus) => {
    return alertHistory.filter(alert => alert.status === status);
  }, [alertHistory]);

  // Statistics
  const alertStats = realTimeAlertService.getAlertStatistics();

  // Load data on mount
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  return {
    activeAlerts,
    alertsForProperty,
    alertHistory,
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,
    getAlertsByType,
    getAlertsBySeverity,
    getAlertsByStatus,
    alertStats,
    isLoading,
    error,
    refreshAlerts,
  };
};

// Hook for specific property alerts
export const usePropertyAlerts = (propertyId: string) => {
  const { alertsForProperty, acknowledgeAlert, resolveAlert, dismissAlert, isLoading, error } = useAlertService();

  const propertyAlerts = alertsForProperty(propertyId);

  return {
    alerts: propertyAlerts,
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,
    isLoading,
    error,
  };
};

// Hook for alert statistics
export const useAlertStats = () => {
  const { alertStats, isLoading, error } = useAlertService();

  return {
    stats: alertStats,
    isLoading,
    error,
  };
};