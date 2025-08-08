import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
 Box,
 Typography,
 Button,
 Table,
 TableBody,
 TableCell,
 TableContainer,
 TableHead,
 TableRow,
 Paper,
 Chip,
 TextField,
 Grid,
 FormControl,
 InputLabel,
 Select,
 MenuItem,
 Pagination,
 Card,
 CardContent,
 IconButton,
 Tooltip
} from '@mui/material';
import {
 Add as AddIcon,
 Edit as EditIcon,
 Visibility as ViewIcon,
 Delete as DeleteIcon,
 Search as SearchIcon
} from '@mui/icons-material';
import { getRentals, deleteRental, Rental, RentalFilterParams } from '../services/rentalService';

const RentalListings = () => {
 const [rentals, setRentals] = useState<Rental[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [filters, setFilters] = useState<RentalFilterParams>({
  page: 1,
  limit: 10,
  sortField: 'createdAt',
  sortOrder: 'desc'
 });
 const [totalPages, setTotalPages] = useState(1);
 const [total, setTotal] = useState(0);

 const fetchRentals = async () => {
  try {
   setLoading(true);
   setError(null);
   const response = await getRentals(filters);
   if (response && response.data) {
    setRentals(response.data || []);
    if (response.meta) {
     setTotalPages(response.meta.totalPages);
     setTotal(response.meta.total);
    } else {
     setTotalPages(1);
     setTotal(response.data.length);
    }
   } else {
    setRentals([]);
    setTotalPages(1);
    setTotal(0);
   }
  } catch (err: any) {
   setError(err.message || 'Failed to fetch rentals');
   setRentals([]);
   setTotal(0);
   setTotalPages(1);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchRentals();
 }, [filters]);

 const handleFilterChange = (field: keyof RentalFilterParams, value: any) => {
  setFilters(prev => ({
   ...prev,
   [field]: value,
   page: 1 // Reset to first page when filtering
  }));
 };

 const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
  setFilters(prev => ({ ...prev, page: value }));
 };

 const handleDelete = async (id: string) => {
  if (window.confirm('Are you sure you want to delete this rental?')) {
   try {
    await deleteRental(id);
    fetchRentals(); // Refresh the list
   } catch (err: any) {
    setError(err.message || 'Failed to delete rental');
   }
  }
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

 const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
   style: 'currency',
   currency: 'USD'
  }).format(amount);
 };

 if (loading) {
  return (
   <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
    <Typography>Loading rentals...</Typography>
   </Box>
  );
 }

 return (
  <Box p={3}>
   <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
    <Typography variant="h4" component="h1">
     Rental Listings
    </Typography>
    <Button
     component={Link}
     to="/rentals/new"
     variant="contained"
     startIcon={<AddIcon />}
     color="primary"
    >
     Add Rental
    </Button>
   </Box>

   {error && (
    <Box mb={2}>
     <Typography color="error">{error}</Typography>
    </Box>
   )}

   {/* Filters */}
   <Card sx={{ mb: 3 }}>
    <CardContent>
     <Typography variant="h6" gutterBottom>
      Filters
     </Typography>
     <Grid container spacing={2}>
      <Grid xs={12} sm={6} md={4}>
       <TextField
        fullWidth
        label="Search Title"
        value={filters.title || ''}
        onChange={(e) => handleFilterChange('title', e.target.value)}
        InputProps={{
         endAdornment: <SearchIcon />
        }}
       />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
       <TextField
        fullWidth
        label="City"
        value={filters.city || ''}
        onChange={(e) => handleFilterChange('city', e.target.value)}
       />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
       <FormControl fullWidth>
        <InputLabel>Property Type</InputLabel>
        <Select
         value={filters.propertyType || ''}
         onChange={(e) => handleFilterChange('propertyType', e.target.value)}
         label="Property Type"
        >
         <MenuItem value="">All Types</MenuItem>
         <MenuItem value="APARTMENT">Apartment</MenuItem>
         <MenuItem value="HOUSE">House</MenuItem>
         <MenuItem value="CONDO">Condo</MenuItem>
         <MenuItem value="TOWNHOUSE">Townhouse</MenuItem>
         <MenuItem value="COMMERCIAL">Commercial</MenuItem>
         <MenuItem value="INDUSTRIAL">Industrial</MenuItem>
         <MenuItem value="OTHER">Other</MenuItem>
        </Select>
       </FormControl>
      </Grid>
      <Grid xs={12} sm={6} md={4}>
       <FormControl fullWidth>
        <InputLabel>Status</InputLabel>
        <Select
         value={filters.status || ''}
         onChange={(e) => handleFilterChange('status', e.target.value)}
         label="Status"
        >
         <MenuItem value="">All Statuses</MenuItem>
         <MenuItem value="ACTIVE">Active</MenuItem>
         <MenuItem value="PENDING">Pending</MenuItem>
         <MenuItem value="DRAFT">Draft</MenuItem>
         <MenuItem value="ARCHIVED">Archived</MenuItem>
        </Select>
       </FormControl>
      </Grid>
      <Grid xs={12} sm={6} md={4}>
       <TextField
        fullWidth
        label="Min Rent"
        type="number"
        value={filters.minRent || ''}
        onChange={(e) => handleFilterChange('minRent', e.target.value ? Number(e.target.value) : undefined)}
       />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
       <TextField
        fullWidth
        label="Max Rent"
        type="number"
        value={filters.maxRent || ''}
        onChange={(e) => handleFilterChange('maxRent', e.target.value ? Number(e.target.value) : undefined)}
       />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
       <FormControl fullWidth>
        <InputLabel>Availability</InputLabel>
        <Select
         value={filters.isAvailable !== undefined ? filters.isAvailable.toString() : ''}
         onChange={(e) => handleFilterChange('isAvailable', e.target.value === 'true')}
         label="Availability"
        >
         <MenuItem value="">All</MenuItem>
         <MenuItem value="true">Available</MenuItem>
         <MenuItem value="false">Not Available</MenuItem>
        </Select>
       </FormControl>
      </Grid>
     </Grid>
    </CardContent>
   </Card>

   {/* Results Summary */}
   <Box mb={2}>
    <Typography variant="body2" color="textSecondary">
     Showing {rentals.length} of {total} rentals
    </Typography>
   </Box>

   {/* Rentals Table */}
   <TableContainer component={Paper}>
    <Table>
     <TableHead>
      <TableRow>
       <TableCell>Title</TableCell>
       <TableCell>Address</TableCell>
       <TableCell>Type</TableCell>
       <TableCell>Rent</TableCell>
       <TableCell>Bedrooms</TableCell>
       <TableCell>Bathrooms</TableCell>
       <TableCell>Status</TableCell>
       <TableCell>Available</TableCell>
       <TableCell>Actions</TableCell>
      </TableRow>
     </TableHead>
     <TableBody>
      {rentals.map((rental) => (
       <TableRow key={rental.id}>
        <TableCell>
         <Link to={`/rentals/${rental.id}`} style={{ textDecoration: 'none' }}>
          <Typography variant="body2" color="primary">
           {rental.title}
          </Typography>
         </Link>
        </TableCell>
        <TableCell>
         <Typography variant="body2">
          {rental.address}, {rental.city}, {rental.state}
         </Typography>
        </TableCell>
        <TableCell>
         <Chip 
          label={rental.propertyType} 
          size="small" 
          variant="outlined"
         />
        </TableCell>
        <TableCell>
         <Typography variant="body2" fontWeight="bold">
          {formatCurrency(rental.rent)}
         </Typography>
        </TableCell>
        <TableCell>{rental.bedrooms || 'N/A'}</TableCell>
        <TableCell>{rental.bathrooms || 'N/A'}</TableCell>
        <TableCell>
         <Chip 
          label={rental.status} 
          size="small" 
          color={getStatusColor(rental.status) as any}
         />
        </TableCell>
        <TableCell>
         <Chip 
          label={rental.isAvailable ? 'Available' : 'Not Available'} 
          size="small" 
          color={rental.isAvailable ? 'success' : 'default'}
         />
        </TableCell>
        <TableCell>
         <Box display="flex" gap={1}>
          <Tooltip title="View Details">
           <IconButton
            component={Link}
            to={`/rentals/${rental.id}`}
            size="small"
            color="primary"
           >
            <ViewIcon />
           </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
           <IconButton
            component={Link}
            to={`/rentals/${rental.id}/edit`}
            size="small"
            color="secondary"
           >
            <EditIcon />
           </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
           <IconButton
            onClick={() => handleDelete(rental.id)}
            size="small"
            color="error"
           >
            <DeleteIcon />
           </IconButton>
          </Tooltip>
         </Box>
        </TableCell>
       </TableRow>
      ))}
     </TableBody>
    </Table>
   </TableContainer>

   {/* Pagination */}
   {totalPages > 1 && (
    <Box display="flex" justifyContent="center" mt={3}>
     <Pagination
      count={totalPages}
      page={filters.page || 1}
      onChange={handlePageChange}
      color="primary"
     />
    </Box>
   )}
  </Box>
 );
};

export default RentalListings;
