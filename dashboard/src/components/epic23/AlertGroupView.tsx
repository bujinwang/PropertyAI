import React, { useState, useEffect } from 'react';
import { Alert, Card, CardContent, Chip, Collapse, Box, Select, MenuItem, FormControl, InputLabel, Typography, IconButton, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// API service for alert groups
const alertGroupsApi = {
  getByProperty: async (propertyId: string) => {
    const response = await fetch(`/api/alert-groups/property/${propertyId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch alert groups');
    return response.json();
  },

  incrementCount: async (id: string, incrementBy: number = 1) => {
    const response = await fetch(`/api/alert-groups/${id}/increment`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ incrementBy })
    });
    if (!response.ok) throw new Error('Failed to increment alert count');
    return response.json();
  },

  decrementCount: async (id: string, decrementBy: number = 1) => {
    const response = await fetch(`/api/alert-groups/${id}/decrement`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ decrementBy })
    });
    if (!response.ok) throw new Error('Failed to decrement alert count');
    return response.json();
  }
};

// Types
interface AlertGroup {
  id: string;
  groupType: 'MAINTENANCE' | 'CHURN' | 'MARKET';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  propertyId: string;
  alertCount: number;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    title: string;
  };
}

interface MaintenanceAlert {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: string;
}

interface AlertGroupViewProps {
  groups: AlertGroup[];
  alerts: MaintenanceAlert[]; // Full alerts for rendering
  onFilterChange?: (filters: { type?: string; priority?: string }) => void;
  compact?: boolean;
}

const AlertGroupView: React.FC<AlertGroupViewProps> = ({ groups, alerts, onFilterChange, compact = false }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState({ type: '', priority: '' });

  const handleExpand = (groupId: string) => {
    setExpanded(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleFilterChange = (key: 'type' | 'priority', value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      critical: 'error',
    };
    return colors[priority as keyof typeof colors] || 'default';
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.type && alert.type !== filters.type) return false;
    if (filters.priority && alert.priority !== filters.priority) return false;
    return true;
  });

  // Group filtered alerts
  const groupedAlerts = groups.map(group => ({
    ...group,
    alerts: filteredAlerts.filter(a => a.type === group.groupType && a.priority === group.priority),
  })).filter(g => g.alerts.length > 0);

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {groupedAlerts.map(group => (
          <Chip
            key={group.id}
            label={`${group.groupType} (${group.alerts.length})`}
            color={getPriorityColor(group.priority)}
            size="small"
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="churn">Churn</MenuItem>
            <MenuItem value="market">Market</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Priority</InputLabel>
          <Select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Groups */}
      {groupedAlerts.length === 0 ? (
        <Alert severity="info">No alerts matching the filters.</Alert>
      ) : (
        groupedAlerts.map(group => (
          <Card key={group.id} sx={{ mb: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleExpand(group.id)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip label={group.groupType} color="primary" size="small" />
                  <Chip label={group.priority.toUpperCase()} color={getPriorityColor(group.priority)} size="small" />
                  <Typography variant="h6">{group.groupType} Alerts ({group.alerts.length})</Typography>
                </Box>
                <IconButton>
                  {expanded[group.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Collapse in={expanded[group.id] || false}>
                <Box sx={{ p: 2, pt: 0 }}>
                  {group.alerts.map(alert => (
                    <Alert
                      key={alert.id}
                      severity={alert.priority as any}
                      sx={{ mb: 1 }}
                      onClose={() => {/* handle dismiss */}}
                    >
                      <Typography variant="body2">{alert.message}</Typography>
                      <Typography variant="caption">{new Date(alert.createdAt).toLocaleDateString()}</Typography>
                    </Alert>
                  ))}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

export default AlertGroupView;
