import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Typography,
  Skeleton,
  Alert,
  Box,
} from '@mui/material';
import { queryKeys } from '../config/queryClient';
import { dashboardService, VacantUnit } from '../services/dashboardService';

const VacantUnitsSummary: React.FC = () => {
  const { data: vacantUnits, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.vacantUnits(),
    queryFn: dashboardService.getVacantUnits,
  });

  const count = vacantUnits?.length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader
          title={<Skeleton variant="text" width="40%" aria-label="Loading vacant units" />}
          subheader={<Skeleton variant="text" width="60%" />}
        />
        <CardContent>
          <Skeleton variant="rectangular" height={100} aria-label="Loading vacant units content" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Vacant Units Summary" />
        <CardContent>
          <Alert severity="error" role="alert" aria-live="polite">
            Failed to load vacant units: {(error as Error).message}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Vacant Units Summary"
        subheader={
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={count}
              color={count > 0 ? 'warning' : 'success'}
              size="small"
              aria-label={`${count} vacant units`}
            />
            <Typography variant="body2" color="text.secondary">
              {count} unit{count !== 1 ? 's' : ''} available
            </Typography>
          </Box>
        }
      />
      <CardContent>
        {count === 0 ? (
          <Typography color="text.secondary" role="status">No vacant units</Typography>
        ) : (
          <List dense role="list" aria-label="Vacant units list">
            {vacantUnits?.slice(0, 5).map((unit: VacantUnit) => (
              <ListItem key={unit.id} divider role="listitem">
                <ListItemText
                  primary={`Unit ${unit.unitNumber}`}
                  secondary={
                    <Box>
                      <Typography component="span" variant="body2" color="text.primary">
                        {unit.address}, {unit.city}, {unit.state}
                      </Typography>
                      <Typography component="span" variant="body2" color="text.secondary">
                        {' • $'}{unit.rent}/mo • {unit.bedrooms}bd/{unit.bathrooms}ba
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
            {vacantUnits && vacantUnits.length > 5 && (
              <ListItem role="listitem">
                <ListItemText
                  primary="..."
                  secondary="View all vacant units"
                />
              </ListItem>
            )}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default VacantUnitsSummary;