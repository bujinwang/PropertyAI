/**
 * Offline Indicator Component
 * Shows offline status and provides sync controls
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

import React, { useState, useEffect } from 'react';
import offlineManager, { type OfflineStatus } from '../utils/offlineManager';
import './OfflineIndicator.css';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  autoSync?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showDetails = true,
  autoSync = true
}) => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: true,
    hasPendingSync: false,
    offlineDataCount: 0,
    syncInProgress: false
  });
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string>('');

  useEffect(() => {
    // Subscribe to offline status changes
    const unsubscribe = offlineManager.onStatusChange((newStatus) => {
      setStatus(newStatus);

      // Auto-sync when coming back online (if enabled)
      if (autoSync && newStatus.isOnline && newStatus.hasPendingSync && !newStatus.syncInProgress) {
        handleSync();
      }
    });

    return unsubscribe;
  }, [autoSync]);

  const handleSync = async () => {
    try {
      const result = await offlineManager.syncOfflineData();
      if (result.success) {
        setLastSyncResult(`Synced ${result.syncedItems} items successfully`);
      } else {
        setLastSyncResult(`Sync failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      setLastSyncResult(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Clear result message after 5 seconds
    setTimeout(() => setLastSyncResult(''), 5000);
  };

  const handleBackgroundSync = async () => {
    const success = await offlineManager.requestBackgroundSync();
    if (success) {
      setLastSyncResult('Background sync requested');
    } else {
      setLastSyncResult('No pending items to sync');
    }

    setTimeout(() => setLastSyncResult(''), 3000);
  };

  const getStatusIcon = () => {
    if (status.syncInProgress) {
      return '🔄';
    }
    if (!status.isOnline) {
      return '📶';
    }
    if (status.hasPendingSync) {
      return '⚠️';
    }
    return '✅';
  };

  const getStatusText = () => {
    if (status.syncInProgress) {
      return 'Syncing...';
    }
    if (!status.isOnline) {
      return 'Offline';
    }
    if (status.hasPendingSync) {
      return `${status.offlineDataCount} items to sync`;
    }
    return 'Online';
  };

  const getStatusClass = () => {
    if (status.syncInProgress) {
      return 'syncing';
    }
    if (!status.isOnline) {
      return 'offline';
    }
    if (status.hasPendingSync) {
      return 'pending-sync';
    }
    return 'online';
  };

  return (
    <div className={`offline-indicator ${getStatusClass()} ${className}`}>
      <div
        className="offline-indicator-main"
        onClick={() => setShowDetailsPanel(!showDetailsPanel)}
      >
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
        {showDetails && (
          <span className="details-toggle">
            {showDetailsPanel ? '▲' : '▼'}
          </span>
        )}
      </div>

      {showDetails && showDetailsPanel && (
        <div className="offline-details-panel">
          <div className="status-details">
            <div className="detail-item">
              <span className="detail-label">Connection:</span>
              <span className={`detail-value ${status.isOnline ? 'online' : 'offline'}`}>
                {status.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Pending Sync:</span>
              <span className={`detail-value ${status.hasPendingSync ? 'warning' : 'success'}`}>
                {status.offlineDataCount} items
              </span>
            </div>

            {status.lastSyncTime && (
              <div className="detail-item">
                <span className="detail-label">Last Sync:</span>
                <span className="detail-value">
                  {new Date(status.lastSyncTime).toLocaleTimeString()}
                </span>
              </div>
            )}

            {lastSyncResult && (
              <div className="detail-item">
                <span className="detail-label">Last Result:</span>
                <span className="detail-value result">{lastSyncResult}</span>
              </div>
            )}
          </div>

          <div className="sync-controls">
            <button
              className="sync-button primary"
              onClick={handleSync}
              disabled={!status.isOnline || status.syncInProgress}
            >
              {status.syncInProgress ? 'Syncing...' : 'Sync Now'}
            </button>

            <button
              className="sync-button secondary"
              onClick={handleBackgroundSync}
              disabled={!status.hasPendingSync || status.syncInProgress}
            >
              Background Sync
            </button>
          </div>

          <div className="offline-info">
            <p>
              <strong>Offline Features:</strong>
            </p>
            <ul>
              <li>View cached property data</li>
              <li>Access maintenance alerts</li>
              <li>Read tenant information</li>
              <li>Data syncs when online</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;