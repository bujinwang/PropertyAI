/**
 * Real-Time Alert Dashboard Component
 *
 * Comprehensive dashboard for monitoring and managing property alerts
 * in real-time with interactive features and visual indicators
 */

import React, { useState, useEffect } from 'react';
import { useAlertService, useAlertStats } from '../hooks/useAlertService';
import { Alert, AlertType, AlertSeverity } from '../types/alerts';
import './RealTimeAlertDashboard.css';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onResolve,
  onDismiss,
}) => {
  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'maintenance': return '🔧';
      case 'financial': return '💰';
      case 'risk': return '⚠️';
      case 'trend': return '📈';
      case 'emergency': return '🚨';
      case 'system': return '⚙️';
      default: return '📢';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className={`alert-card alert-${alert.severity}`}>
      <div className="alert-header">
        <div className="alert-type-icon">
          {getTypeIcon(alert.type)}
        </div>
        <div className="alert-title-section">
          <h3 className="alert-title">{alert.title}</h3>
          <div className="alert-meta">
            <span className="alert-property">{alert.propertyName || alert.propertyId}</span>
            <span className="alert-time">{formatTimeAgo(alert.createdAt)}</span>
          </div>
        </div>
        <div
          className="alert-severity-indicator"
          style={{ backgroundColor: getSeverityColor(alert.severity) }}
        >
          {alert.severity.toUpperCase()}
        </div>
      </div>

      <div className="alert-content">
        <p className="alert-message">{alert.message}</p>
        <p className="alert-description">{alert.description}</p>

        {alert.metrics && Object.keys(alert.metrics).length > 0 && (
          <div className="alert-metrics">
            <h4>Key Metrics:</h4>
            <div className="metrics-grid">
              {Object.entries(alert.metrics).map(([key, value]) => (
                <div key={key} className="metric-item">
                  <span className="metric-label">{key}:</span>
                  <span className="metric-value">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {alert.recommendations && alert.recommendations.length > 0 && (
          <div className="alert-recommendations">
            <h4>Recommendations:</h4>
            <ul>
              {alert.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="alert-actions">
        {alert.status === 'active' && (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => onAcknowledge(alert.id)}
            >
              Acknowledge
            </button>
            <button
              className="btn btn-success"
              onClick={() => onResolve(alert.id)}
            >
              Resolve
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => onDismiss(alert.id)}
            >
              Dismiss
            </button>
          </>
        )}

        {alert.status === 'acknowledged' && (
          <>
            <button
              className="btn btn-success"
              onClick={() => onResolve(alert.id)}
            >
              Resolve
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => onDismiss(alert.id)}
            >
              Dismiss
            </button>
          </>
        )}

        {alert.status !== 'active' && alert.status !== 'acknowledged' && (
          <span className={`status-badge status-${alert.status}`}>
            {alert.status.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
};

const RealTimeAlertDashboard: React.FC = () => {
  const {
    activeAlerts,
    alertHistory,
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,
    getAlertsByType,
    getAlertsBySeverity,
    isLoading,
    error,
    refreshAlerts,
  } = useAlertService();

  const { stats } = useAlertStats();

  const [filterType, setFilterType] = useState<AlertType | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [showHistory, setShowHistory] = useState(false);

  // Auto-refresh alerts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshAlerts]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId, 'current-user'); // In real app, get from auth context
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      await dismissAlert(alertId);
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const filteredAlerts = activeAlerts.filter(alert => {
    if (filterType !== 'all' && alert.type !== filterType) return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    return true;
  });

  const displayAlerts = showHistory ? alertHistory.slice(0, 50) : filteredAlerts;

  if (isLoading && activeAlerts.length === 0) {
    return (
      <div className="alert-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading alerts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-dashboard error">
        <div className="error-message">
          <h3>Error Loading Alerts</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={refreshAlerts}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="alert-dashboard">
      <div className="dashboard-header">
        <h1>Real-Time Alert Dashboard</h1>
        <div className="dashboard-controls">
          <button
            className="btn btn-outline-primary"
            onClick={refreshAlerts}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            className={`btn ${showHistory ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Show Active' : 'Show History'}
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="alert-stats">
        <div className="stat-card">
          <h3>Active Alerts</h3>
          <div className="stat-value">{stats.totalActive}</div>
        </div>
        <div className="stat-card">
          <h3>Critical</h3>
          <div className="stat-value critical">{stats.bySeverity.critical || 0}</div>
        </div>
        <div className="stat-card">
          <h3>High</h3>
          <div className="stat-value high">{stats.bySeverity.high || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Recent Activity</h3>
          <div className="stat-value">{stats.recentActivity}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="alert-filters">
        <div className="filter-group">
          <label>Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as AlertType | 'all')}
          >
            <option value="all">All Types</option>
            <option value="maintenance">Maintenance</option>
            <option value="financial">Financial</option>
            <option value="risk">Risk</option>
            <option value="trend">Trend</option>
            <option value="emergency">Emergency</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Severity:</label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as AlertSeverity | 'all')}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Alert List */}
      <div className="alert-list">
        {displayAlerts.length === 0 ? (
          <div className="no-alerts">
            <h3>No {showHistory ? 'historical' : 'active'} alerts found</h3>
            <p>
              {showHistory
                ? 'Alert history will appear here as alerts are generated and resolved.'
                : 'All clear! No active alerts at this time.'
              }
            </p>
          </div>
        ) : (
          displayAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </div>

      {/* Alert Type Breakdown */}
      <div className="alert-breakdown">
        <h3>Alert Breakdown by Type</h3>
        <div className="breakdown-grid">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="breakdown-item">
              <span className="breakdown-label">{type}:</span>
              <span className="breakdown-value">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealTimeAlertDashboard;