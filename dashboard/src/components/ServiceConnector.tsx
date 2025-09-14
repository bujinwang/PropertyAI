import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { BaseConnector, ConnectorStatus } from '../utils/connectorFramework';

interface ServiceConnectorProps {
  connector: BaseConnector;
  onSync?: () => void;
  onConfigure?: () => void;
  showControls?: boolean;
}

const ServiceConnector: React.FC<ServiceConnectorProps> = ({
  connector,
  onSync,
  onConfigure,
  showControls = true,
}) => {
  const [status, setStatus] = useState<ConnectorStatus>(connector.getStatus());
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(connector.getStatus());
    };

    // Update status periodically
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, [connector]);

  const handleSync = async () => {
    if (status !== 'connected') return;

    try {
      setSyncing(true);
      setError(null);
      await connector.sync();
      if (onSync) onSync();
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon color="success" />;
      case 'disconnected':
        return <CancelIcon color="error" />;
      case 'error':
        return <WarningIcon color="warning" />;
      case 'pending':
      case 'syncing':
        return <ScheduleIcon color="info" />;
      default:
        return <WarningIcon />;
    }
  };

  const getStatusColor = (): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'disconnected':
        return 'error';
      case 'error':
        return 'warning';
      case 'pending':
      case 'syncing':
        return 'info';
      default:
        return 'default';
    }
  };

  const getConnectorIcon = () => {
    switch (connector.type) {
      case 'background_check':
        return '🔍';
      case 'maintenance_vendor':
        return '🔧';
      case 'document_storage':
        return '📄';
      case 'property_listing':
        return '🏠';
      case 'accounting':
        return '💰';
      case 'iot_device':
        return '📡';
      case 'email_sms':
        return '📧';
      case 'webhook':
        return '🔗';
      default:
        return '🔌';
    }
  };

  const config = connector.getConfig();

  return (
    <Card sx={{ minWidth: 280, maxWidth: 400 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">{getConnectorIcon()}</Typography>
            <Box>
              <Typography variant="h6">
                {config.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {config.provider} • {config.type.replace('_', ' ')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {syncing && <CircularProgress size={20} />}
            {getStatusIcon()}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <Chip
            label={status}
            color={getStatusColor()}
            size="small"
          />
          <Chip
            label={config.syncFrequency}
            variant="outlined"
            size="small"
          />
        </Box>

        {config.lastSync && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Last sync: {new Date(config.lastSync).toLocaleString()}
          </Typography>
        )}

        {config.nextSync && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Next sync: {new Date(config.nextSync).toLocaleString()}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
            {error}
          </Alert>
        )}

        {config.errorMessage && status === 'error' && (
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.875rem' }}>
            {config.errorMessage}
          </Alert>
        )}

        {showControls && (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Tooltip title="Sync Now">
              <span>
                <IconButton
                  size="small"
                  onClick={handleSync}
                  disabled={status !== 'connected' || syncing}
                >
                  <SyncIcon />
                </IconButton>
              </span>
            </Tooltip>

            {onConfigure && (
              <Tooltip title="Configure">
                <IconButton size="small" onClick={onConfigure}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceConnector;