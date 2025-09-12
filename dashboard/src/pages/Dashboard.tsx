import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Apartment as ApartmentIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import VacantUnitsSummary from '../components/VacantUnitsSummary';
import MaintenanceRequestsList from '../components/MaintenanceRequestsList';
import OverdueAlerts from '../components/OverdueAlerts';

const Dashboard: React.FC = () => {
  const [showAlert, setShowAlert] = React.useState(true);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Summary of Vacant Units */}
        <Grid item xs={12} md={4} lg={3}>
          <VacantUnitsSummary />
        </Grid>

        {/* List of Recent Maintenance Requests */}
        <Grid item xs={12} md={4} lg={6}>
          <MaintenanceRequestsList />
        </Grid>

        {/* Alerts for Overdue Payments */}
        <Grid item xs={12} md={4} lg={3}>
          <OverdueAlerts />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
