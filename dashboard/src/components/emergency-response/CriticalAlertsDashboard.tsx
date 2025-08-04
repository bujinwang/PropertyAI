import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Badge,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Warning as WarningIcon,
  LocalFireDepartment as FireIcon,
  LocalHospital as MedicalIcon,
  Security as SecurityIcon,
  Build as MaintenanceIcon,
  Cloud as WeatherIcon,
  Help as OtherIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { EmergencyAlert, AlertFilters, AlertSortOptions } from '../../types/emergency-response';
import { emergencyResponseService } from '../../services/emergencyResponseService';
import { formatDistanceToNow } from 'date-fns';

interface CriticalAlertsDashboardProps {
  onAlertSelect?: (alert: EmergencyAlert) => void;
  maxHeight?: number;
  showFilters?: boolean;
}

const ALERT_TYPE_ICONS = {
  fire: FireIcon,
  medical: MedicalIcon,
  security: SecurityIcon,
  maintenance: MaintenanceIcon,
  weather: WeatherIcon,
  other: OtherIcon
};

const ALERT_TYPE_COLORS = {
  fire: '#f44336',
  medical: '#e91e63',
  security: '#ff9800',
  maintenance: '#2196f3',
  weather: '#9c27b0',
  other: '#607d8b'
};

const PRIORITY_COLORS = {
  critical: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  low: '#388e3c'
};

const STATUS_COLORS = {
  active: '#d32f2f',
  acknowledged: '#f57c00',
  in_progress: '#1976d2',
  resolved: '#388e3c'
};

export const CriticalAlertsDashboard: React.FC<CriticalAlertsDashboardProps> = ({
  onAlertSelect,
  maxHeight = 600,
  showFilters = true
}) => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AlertFilters>({});
  const [sortOptions, setSortOptions] = useState<AlertSortOptions>({
    field: 'priority',
    direction: 'desc'
  });
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // Load alerts
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Apply default filters for critical alerts dashboard
      const dashboardFilters: AlertFilters = {
        ...filters,
        status: filters.status || ['active', 'acknowledged', 'in_progress']
      };

      const alertsData = await emergencyResponseService.getAlerts(dashboardFilters, sortOptions);
      setAlerts(alertsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [filters, sortOptions]);

  // Setup real-time connection
  useEffect(() => {
    // Add error handling for WebSocket connection
    let ws: WebSocket | null = null;
    
    try {
      ws = emergencyResponseService.connectToAlerts(
        (newAlert) => {
          setAlerts(prev => {
            const exists = prev.find(alert => alert.id === newAlert.id);
            if (exists) {
              return prev.map(alert => alert.id === newAlert.id ? newAlert : alert);
            }
            return [newAlert, ...prev];
          });
        },
        (update) => {
          if (update.type === 'status_change' || update.type === 'assignment') {
            loadAlerts(); // Refresh the list
          }
        }
      );

      // Add error handling for WebSocket
      ws.onerror = (error) => {
        console.warn('WebSocket connection failed:', error);
        // Fallback to polling if WebSocket fails
        setError('Real-time updates unavailable. Using polling instead.');
      };

      ws.onclose = (event) => {
        if (!event.wasClean) {
          console.warn('WebSocket connection closed unexpectedly');
          // Could implement reconnection logic here
        }
      };

      setWsConnection(ws);
    } catch (error) {
      console.warn('Failed to establish WebSocket connection:', error);
      setError('Real-time updates unavailable. Refresh manually to see latest alerts.');
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [loadAlerts]);

  // Initial load
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    const [field, direction] = event.target.value.split('-') as [AlertSortOptions['field'], AlertSortOptions['direction']];
    setSortOptions({ field, direction });
  };

  const handlePriorityFilter = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFilters(prev => ({
      ...prev,
      priority: typeof value === 'string' ? value.split(',') as EmergencyAlert['priority'][] : value as EmergencyAlert['priority'][]
    }));
  };

  const handleStatusFilter = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFilters(prev => ({
      ...prev,
      status: typeof value === 'string' ? value.split(',') as EmergencyAlert['status'][] : value as EmergencyAlert['status'][]
    }));
  };

  const getAlertIcon = (type: EmergencyAlert['type']) => {
    const IconComponent = ALERT_TYPE_ICONS[type];
    return <IconComponent sx={{ color: ALERT_TYPE_COLORS[type] }} />;
  };

  const getPriorityChip = (priority: EmergencyAlert['priority']) => {
    const color = PRIORITY_COLORS[priority];
    return (
      <Chip
        label={priority.toUpperCase()}
        size="small"
        sx={{
          backgroundColor: color,
          color: 'white',
          fontWeight: 'bold',
          fontSize: '0.75rem'
        }}
      />
    );
  };

  const getStatusChip = (status: EmergencyAlert['status']) => {
    const color = STATUS_COLORS[status];
    return (
      <Chip
        label={status.replace('_', ' ').toUpperCase()}
        size="small"
        variant="outlined"
        sx={{
          borderColor: color,
          color: color,
          fontWeight: 'bold'
        }}
      />
    );
  };

  const formatAlertTime = (timestamp: Date) => {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  const getActiveCriticalCount = () => {
    return alerts.filter(alert => 
      alert.priority === 'critical' && 
      ['active', 'acknowledged'].includes(alert.status)
    ).length;
  };

  const getActiveHighCount = () => {
    return alerts.filter(alert => 
      alert.priority === 'high' && 
      ['active', 'acknowledged'].includes(alert.status)
    ).length;
  };

  if (loading && alerts.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" component="h2">
              Critical Alerts Dashboard
            </Typography>
            <Badge badgeContent={getActiveCriticalCount()} color="error">
              <WarningIcon color="error" />
            </Badge>
            <Badge badgeContent={getActiveHighCount()} color="warning">
              <WarningIcon color="warning" />
            </Badge>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Refresh alerts">
              <IconButton onClick={loadAlerts} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {showFilters && (
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                value={`${sortOptions.field}-${sortOptions.direction}`}
                label="Sort By"
                onChange={handleSortChange}
              >
                <MenuItem value="priority-desc">Priority (High to Low)</MenuItem>
                <MenuItem value="priority-asc">Priority (Low to High)</MenuItem>
                <MenuItem value="timestamp-desc">Newest First</MenuItem>
                <MenuItem value="timestamp-asc">Oldest First</MenuItem>
                <MenuItem value="status-asc">Status</MenuItem>
                <MenuItem value="type-asc">Type</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="priority-filter-label">Priority</InputLabel>
              <Select
                labelId="priority-filter-label"
                multiple
                value={filters.priority || []}
                label="Priority"
                onChange={handlePriorityFilter}
              >
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                multiple
                value={filters.status || ['active', 'acknowledged', 'in_progress']}
                label="Status"
                onChange={handleStatusFilter}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="acknowledged">Acknowledged</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ maxHeight, overflow: 'auto' }}>
          {alerts.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No alerts found matching the current filters.
              </Typography>
            </Box>
          ) : (
            <List>
              {alerts.map((alert, index) => (
                <React.Fragment key={alert.id}>
                  <ListItem
                    component="button"
                    onClick={() => onAlertSelect?.(alert)}
                    sx={{
                      border: alert.priority === 'critical' ? '2px solid #d32f2f' : 
                             alert.priority === 'high' ? '1px solid #f57c00' : 'none',
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: alert.priority === 'critical' ? 'rgba(211, 47, 47, 0.05)' :
                                     alert.priority === 'high' ? 'rgba(245, 124, 0, 0.05)' : 'transparent',
                      '&:hover': {
                        backgroundColor: alert.priority === 'critical' ? 'rgba(211, 47, 47, 0.1)' :
                                       alert.priority === 'high' ? 'rgba(245, 124, 0, 0.1)' : 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <ListItemIcon>
                      {getAlertIcon(alert.type)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="subtitle1" component="span" fontWeight="bold">
                            {alert.title}
                          </Typography>
                          {getPriorityChip(alert.priority)}
                          {getStatusChip(alert.status)}
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block', mb: 0.5 }}>
                            {alert.description}
                          </Typography>
                          
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationIcon fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary" component="span">
                                {alert.location.propertyName}
                                {alert.location.unitNumber && ` - Unit ${alert.location.unitNumber}`}
                              </Typography>
                            </Box>
                            
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimeIcon fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary" component="span">
                                {formatAlertTime(alert.timestamp)}
                              </Typography>
                            </Box>
                            
                            {alert.assignedTo && (
                              <Typography variant="caption" color="primary" component="span">
                                Assigned to: {alert.assignedTo.name}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  
                  {index < alerts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {loading && alerts.length > 0 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress size={24} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CriticalAlertsDashboard;