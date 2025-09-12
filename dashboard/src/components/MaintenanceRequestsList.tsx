import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Typography,
  Skeleton,
  Alert,
  Box,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { queryKeys } from '../config/queryClient';
import { dashboardService, MaintenanceRequest } from '../services/dashboardService';

const MaintenanceRequestsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.maintenanceRequests(),
    queryFn: () => dashboardService.getMaintenanceRequests(1, 10),
  });

  const requests = response?.data;
  const filteredRequests = requests?.filter((req) =>
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.tenantName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: MaintenanceRequest['status']) => {
    switch (status) {
      case 'open':
        return <ErrorIcon color="error" />;
      case 'in_progress':
        return <ScheduleIcon color="warning" />;
      case 'closed':
        return <CheckCircleIcon color="success" />;
      case 'cancelled':
        return <ErrorIcon color="disabled" />;
      default:
        return <BuildIcon />;
    }
  };

  const getStatusColor = (status: MaintenanceRequest['status']) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'in_progress':
        return 'warning';
      case 'closed':
        return 'success';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: MaintenanceRequest['priority']) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleViewDetails = (id: string) => {
    console.log('View details for request:', id);
    // In a real app, navigate to details page or open modal
  };

  const handleEdit = (id: string) => {
    console.log('Edit request:', id);
    // In a real app, open edit modal or navigate to edit page
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader
          title={<Skeleton variant="text" width="60%" aria-label="Loading maintenance requests" />}
          subheader={<Skeleton variant="text" width="40%" />}
        />
        <CardContent>
          <Skeleton variant="rectangular" height={200} aria-label="Loading maintenance requests content" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Recent Maintenance Requests" />
        <CardContent>
          <Alert severity="error" role="alert" aria-live="polite">
            Failed to load maintenance requests: {(error as Error).message}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Recent Maintenance Requests"
        subheader={
          <Box display="flex" alignItems="center" gap={1}>
            <Chip label={filteredRequests?.length || 0} color="primary" size="small" />
            <Typography variant="body2" color="text.secondary">
              {filteredRequests?.length || 0} request{filteredRequests?.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        }
      />
      <CardContent>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search maintenance requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
        {filteredRequests?.length === 0 ? (
          <Typography color="text.secondary">No maintenance requests</Typography>
        ) : (
          <List dense>
            {filteredRequests?.slice(0, 10).map((req: MaintenanceRequest) => (
              <ListItem key={req.id} divider>
                <ListItemAvatar>
                  <Avatar>{getStatusIcon(req.status)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={req.title}
                  secondary={
                    <Box>
                      <Typography component="span" variant="body2" color="text.primary">
                        {req.description}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={1}>
                        <Chip
                          label={req.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(req.status)}
                        />
                        <Chip
                          label={req.priority}
                          size="small"
                          color={getPriorityColor(req.priority)}
                        />
                        {req.tenantName && (
                          <Typography variant="caption" color="text.secondary">
                            {req.tenantName}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  }
                />
                <Box display="flex" gap={1}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(req.id)}
                      aria-label="View details"
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(req.id)}
                      aria-label="Edit request"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            ))}
            {filteredRequests && filteredRequests.length > 10 && (
              <ListItem>
                <ListItemText
                  primary="..."
                  secondary="View all maintenance requests"
                />
              </ListItem>
            )}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceRequestsList;