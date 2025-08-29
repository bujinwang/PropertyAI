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

const Dashboard: React.FC = () => {
  const [showAlert, setShowAlert] = React.useState(true);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Summary of Vacant Units */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ApartmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Vacant Units</Typography>
              </Box>
              <Typography variant="h4" component="p" textAlign="center">
                8
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                component={RouterLink}
                to="/rentals" // Interaction Note: Navigates to property listings
                size="small"
                fullWidth
              >
                View All Listings
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* List of Recent Maintenance Requests */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BuildIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Recent Maintenance Requests</Typography>
              </Box>
              <List dense>
                <ListItem
                  secondaryAction={
                    <>
                      <Button size="small">Approve</Button>
                      <Button size="small">Assign</Button>
                    </>
                  }
                >
                  <ListItemText primary="Fix leaky faucet in Unit 101" />
                </ListItem>
                <Divider component="li" />
                <ListItem
                  secondaryAction={
                    <>
                      <Button size="small">Approve</Button>
                      <Button size="small">Assign</Button>
                    </>
                  }
                >
                  <ListItemText primary="Broken window in lobby" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts for Overdue Payments */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Alerts</Typography>
              </Box>
              {showAlert && (
                <Alert
                  severity="warning"
                  onClose={() => { setShowAlert(false) }} // Interaction Note: Alerts are dismissible
                >
                  Unit 204: Rent payment is 5 days overdue.
                </Alert>
              )}
              {!showAlert && (
                 <Typography variant="body2" color="text.secondary">
                    No new alerts.
                 </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
