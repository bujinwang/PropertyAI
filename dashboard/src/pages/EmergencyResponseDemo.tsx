import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { CriticalAlertsDashboard } from '../components/emergency-response';
import { EmergencyAlert } from '../types/emergency-response';
import { formatDistanceToNow } from 'date-fns';

const EmergencyResponseDemo: React.FC = () => {
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);

  const handleAlertSelect = (alert: EmergencyAlert) => {
    setSelectedAlert(alert);
  };

  const handleCloseDialog = () => {
    setSelectedAlert(null);
  };

  const getPriorityColor = (priority: EmergencyAlert['priority']) => {
    const colors = {
      critical: 'error',
      high: 'warning',
      medium: 'info',
      low: 'success'
    } as const;
    return colors[priority];
  };

  const getStatusColor = (status: EmergencyAlert['status']) => {
    const colors = {
      active: 'error',
      acknowledged: 'warning',
      in_progress: 'info',
      resolved: 'success'
    } as const;
    return colors[status];
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Emergency Response Center Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This demo showcases the Critical Alerts Dashboard component with real-time alert monitoring,
          priority-based sorting, and color-coded status indicators.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <CriticalAlertsDashboard
            onAlertSelect={handleAlertSelect}
            maxHeight={700}
            showFilters={true}
          />
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dashboard Features
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Real-time Updates
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Alerts are updated in real-time via WebSocket connection
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Priority Sorting
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label="Critical" color="error" size="small" />
                    <Chip label="High" color="warning" size="small" />
                    <Chip label="Medium" color="info" size="small" />
                    <Chip label="Low" color="success" size="small" />
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Status Indicators
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label="Active" color="error" variant="outlined" size="small" />
                    <Chip label="Acknowledged" color="warning" variant="outlined" size="small" />
                    <Chip label="In Progress" color="info" variant="outlined" size="small" />
                    <Chip label="Resolved" color="success" variant="outlined" size="small" />
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Alert Types
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fire, Medical, Security, Maintenance, Weather, and Other emergencies
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Filtering & Sorting
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Filter by priority, status, and sort by various criteria
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert Detail Dialog */}
      <Dialog
        open={!!selectedAlert}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6" component="span">
                  {selectedAlert.title}
                </Typography>
                <Chip
                  label={selectedAlert.priority.toUpperCase()}
                  color={getPriorityColor(selectedAlert.priority)}
                  size="small"
                />
                <Chip
                  label={selectedAlert.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(selectedAlert.status)}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Stack spacing={3}>
                <Typography variant="body1">
                  {selectedAlert.description}
                </Typography>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Location
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {selectedAlert.location.propertyName}
                      {selectedAlert.location.unitNumber && ` - Unit ${selectedAlert.location.unitNumber}`}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" ml={3}>
                    {selectedAlert.location.address}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Timeline
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TimeIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      Reported {formatDistanceToNow(selectedAlert.timestamp, { addSuffix: true })}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Reported By
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {selectedAlert.reportedBy.name} ({selectedAlert.reportedBy.role})
                    </Typography>
                  </Box>
                </Box>

                {selectedAlert.assignedTo && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Assigned To
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {selectedAlert.assignedTo.name} ({selectedAlert.assignedTo.role})
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" ml={3}>
                      Contact: {selectedAlert.assignedTo.contact}
                    </Typography>
                  </Box>
                )}

                {selectedAlert.estimatedResolution && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Estimated Resolution
                    </Typography>
                    <Typography variant="body2">
                      {formatDistanceToNow(selectedAlert.estimatedResolution, { addSuffix: true })}
                    </Typography>
                  </Box>
                )}

                {selectedAlert.updates.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Recent Updates
                    </Typography>
                    <Stack spacing={1}>
                      {selectedAlert.updates.slice(0, 3).map((update) => (
                        <Box key={update.id} sx={{ pl: 2, borderLeft: '2px solid #e0e0e0' }}>
                          <Typography variant="body2">
                            {update.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(update.timestamp, { addSuffix: true })} by {update.updatedBy.name}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleCloseDialog}>
                Close
              </Button>
              <Button variant="contained" color="primary">
                View Full Details
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default EmergencyResponseDemo;