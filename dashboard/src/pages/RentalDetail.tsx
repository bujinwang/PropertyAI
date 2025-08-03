import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { getRental, deleteRental, Rental } from '../services/rentalService';

const RentalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRental = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getRental(id);
        setRental(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch rental details');
      } finally {
        setLoading(false);
      }
    };

    fetchRental();
  }, [id]);

  const handleDelete = async () => {
    if (!rental || !window.confirm('Are you sure you want to delete this rental?')) return;
    
    try {
      await deleteRental(rental.id);
      navigate('/rentals');
    } catch (err: any) {
      setError(err.message || 'Failed to delete rental');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'DRAFT': return 'info';
      case 'ARCHIVED': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading rental details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button component={Link} to="/rentals" sx={{ mt: 2 }}>
          Back to Rentals
        </Button>
      </Box>
    );
  }

  if (!rental) {
    return (
      <Box p={3}>
        <Alert severity="warning">Rental not found</Alert>
        <Button component={Link} to="/rentals" sx={{ mt: 2 }}>
          Back to Rentals
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton component={Link} to="/rentals">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {rental.title}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            component={Link}
            to={`/rentals/${rental.id}/edit`}
            variant="outlined"
            startIcon={<EditIcon />}
          >
            Edit
          </Button>
          <Button
            onClick={handleDelete}
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <LocationIcon color="primary" />
                    <Typography variant="body1">
                      {rental.address}, {rental.city}, {rental.state} {rental.zipCode}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Property Type
                  </Typography>
                  <Chip label={rental.propertyType} variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip 
                    label={rental.status} 
                    color={getStatusColor(rental.status) as any}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Availability
                  </Typography>
                  <Chip 
                    label={rental.isAvailable ? 'Available' : 'Not Available'} 
                    color={rental.isAvailable ? 'success' : 'default'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Active
                  </Typography>
                  <Chip 
                    label={rental.isActive ? 'Active' : 'Inactive'} 
                    color={rental.isActive ? 'success' : 'default'}
                  />
                </Grid>
                {rental.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {rental.description}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Financial Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Monthly Rent"
                    secondary={formatCurrency(rental.rent)}
                  />
                </ListItem>
                {rental.deposit && (
                  <ListItem>
                    <ListItemText
                      primary="Security Deposit"
                      secondary={formatCurrency(rental.deposit)}
                    />
                  </ListItem>
                )}
                {rental.availableDate && (
                  <ListItem>
                    <ListItemText
                      primary="Available Date"
                      secondary={formatDate(rental.availableDate)}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Property Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <HomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Property Details
              </Typography>
              <Grid container spacing={2}>
                {rental.bedrooms && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Bedrooms
                    </Typography>
                    <Typography variant="body1">{rental.bedrooms}</Typography>
                  </Grid>
                )}
                {rental.bathrooms && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Bathrooms
                    </Typography>
                    <Typography variant="body1">{rental.bathrooms}</Typography>
                  </Grid>
                )}
                {rental.size && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Square Footage
                    </Typography>
                    <Typography variant="body1">{rental.size} sq ft</Typography>
                  </Grid>
                )}
                {rental.yearBuilt && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Year Built
                    </Typography>
                    <Typography variant="body1">{rental.yearBuilt}</Typography>
                  </Grid>
                )}
                {rental.unitNumber && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Unit Number
                    </Typography>
                    <Typography variant="body1">{rental.unitNumber}</Typography>
                  </Grid>
                )}
                {rental.floorNumber && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Floor Number
                    </Typography>
                    <Typography variant="body1">{rental.floorNumber}</Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Total Units
                  </Typography>
                  <Typography variant="body1">{rental.totalUnits}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Management Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Management Information
              </Typography>
              <List dense>
                {rental.Manager && (
                  <ListItem>
                    <ListItemText
                      primary="Manager"
                      secondary={`${rental.Manager.firstName} ${rental.Manager.lastName} (${rental.Manager.email})`}
                    />
                  </ListItem>
                )}
                {rental.Owner && (
                  <ListItem>
                    <ListItemText
                      primary="Owner"
                      secondary={`${rental.Owner.firstName} ${rental.Owner.lastName} (${rental.Owner.email})`}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText
                    primary="Created"
                    secondary={formatDate(rental.createdAt)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Last Updated"
                    secondary={formatDate(rental.updatedAt)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="View Count"
                    secondary={rental.viewCount}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Amenities */}
        {rental.amenities && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Amenities
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {Object.entries(rental.amenities).map(([key, value]) => (
                    value && (
                      <Chip 
                        key={key} 
                        label={key.replace(/([A-Z])/g, ' $1').trim()} 
                        variant="outlined" 
                        size="small"
                      />
                    )
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Lease Terms */}
        {rental.leaseTerms && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Lease Terms
                </Typography>
                <Typography variant="body1">
                  {rental.leaseTerms}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default RentalDetail;