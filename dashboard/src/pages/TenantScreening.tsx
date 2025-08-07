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
 Card,
 CardContent,
 IconButton,
 Tooltip,
 Alert,
} from '@mui/material';
import {
 Visibility as ViewIcon,
 Edit as EditIcon,
 Delete as DeleteIcon,
 Add as AddIcon,
 Search as SearchIcon,
 FilterList as FilterIcon,
} from '@mui/icons-material';

interface TenantApplication {
 id: string;
 applicantName: string;
 email: string;
 phone: string;
 rentalProperty: string;
 applicationDate: string;
 status: 'pending' | 'approved' | 'rejected' | 'under_review';
 creditScore?: number;
 monthlyIncome?: number;
 employmentStatus: string;
 references: number;
}

const TenantScreening: React.FC = () => {
 const [applications, setApplications] = useState<TenantApplication[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [searchTerm, setSearchTerm] = useState('');
 const [statusFilter, setStatusFilter] = useState('');

 // Mock data for demonstration
 useEffect(() => {
  const mockApplications: TenantApplication[] = [
   {
    id: '1',
    applicantName: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    rentalProperty: 'Downtown Apartment 2B',
    applicationDate: '2024-01-15',
    status: 'pending',
    creditScore: 720,
    monthlyIncome: 5000,
    employmentStatus: 'Full-time',
    references: 3,
   },
   {
    id: '2',
    applicantName: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 987-6543',
    rentalProperty: 'Suburban House 123',
    applicationDate: '2024-01-14',
    status: 'under_review',
    creditScore: 680,
    monthlyIncome: 4200,
    employmentStatus: 'Full-time',
    references: 2,
   },
   {
    id: '3',
    applicantName: 'Mike Davis',
    email: 'mike.davis@email.com',
    phone: '(555) 456-7890',
    rentalProperty: 'City Loft 5A',
    applicationDate: '2024-01-13',
    status: 'approved',
    creditScore: 750,
    monthlyIncome: 6000,
    employmentStatus: 'Full-time',
    references: 4,
   },
  ];

  setTimeout(() => {
   setApplications(mockApplications);
   setLoading(false);
  }, 1000);
 }, []);

 const getStatusColor = (status: string) => {
  switch (status) {
   case 'approved':
    return 'success';
   case 'rejected':
    return 'error';
   case 'under_review':
    return 'warning';
   case 'pending':
    return 'info';
   default:
    return 'default';
  }
 };

 const getStatusLabel = (status: string) => {
  switch (status) {
   case 'approved':
    return 'Approved';
   case 'rejected':
    return 'Rejected';
   case 'under_review':
    return 'Under Review';
   case 'pending':
    return 'Pending';
   default:
    return status;
  }
 };

 const filteredApplications = applications.filter(app => {
  const matchesSearch = app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
             app.rentalProperty.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesStatus = statusFilter === '' || app.status === statusFilter;
  return matchesSearch && matchesStatus;
 });

 if (loading) {
  return (
   <Box>
    <Typography variant="h4" gutterBottom>
     Tenant Screening
    </Typography>
    <Typography>Loading applications...</Typography>
   </Box>
  );
 }

 if (error) {
  return (
   <Box>
    <Typography variant="h4" gutterBottom>
     Tenant Screening
    </Typography>
    <Alert severity="error">{error}</Alert>
   </Box>
  );
 }

 return (
  <Box>
   <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
    <Typography variant="h4">
     Tenant Screening
    </Typography>
    <Button
     variant="contained"
     startIcon={<AddIcon />}
     component={Link}
     to="/tenant-screening/applications/new"
    >
     New Application
    </Button>
   </Box>

   {/* Summary Cards */}
   <Grid container spacing={3} mb={3}>
    <Grid xs={12} sm={6} md={3}>
     <Card>
      <CardContent>
       <Typography color="textSecondary" gutterBottom>
        Total Applications
       </Typography>
       <Typography variant="h4">
        {applications.length}
       </Typography>
      </CardContent>
     </Card>
    </Grid>
    <Grid xs={12} sm={6} md={3}>
     <Card>
      <CardContent>
       <Typography color="textSecondary" gutterBottom>
        Pending Review
       </Typography>
       <Typography variant="h4">
        {applications.filter(app => app.status === 'pending').length}
       </Typography>
      </CardContent>
     </Card>
    </Grid>
    <Grid xs={12} sm={6} md={3}>
     <Card>
      <CardContent>
       <Typography color="textSecondary" gutterBottom>
        Under Review
       </Typography>
       <Typography variant="h4">
        {applications.filter(app => app.status === 'under_review').length}
       </Typography>
      </CardContent>
     </Card>
    </Grid>
    <Grid xs={12} sm={6} md={3}>
     <Card>
      <CardContent>
       <Typography color="textSecondary" gutterBottom>
        Approved
       </Typography>
       <Typography variant="h4">
        {applications.filter(app => app.status === 'approved').length}
       </Typography>
      </CardContent>
     </Card>
    </Grid>
   </Grid>

   {/* Filters */}
   <Card sx={{ mb: 3 }}>
    <CardContent>
     <Grid container spacing={2} alignItems="center">
      <Grid xs={12} md={6}>
       <TextField
        fullWidth
        label="Search applications"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
         startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
       />
      </Grid>
      <Grid xs={12} md={3}>
       <FormControl fullWidth>
        <InputLabel>Status</InputLabel>
        <Select
         value={statusFilter}
         label="Status"
         onChange={(e) => setStatusFilter(e.target.value)}
        >
         <MenuItem value="">All Statuses</MenuItem>
         <MenuItem value="pending">Pending</MenuItem>
         <MenuItem value="under_review">Under Review</MenuItem>
         <MenuItem value="approved">Approved</MenuItem>
         <MenuItem value="rejected">Rejected</MenuItem>
        </Select>
       </FormControl>
      </Grid>
     </Grid>
    </CardContent>
   </Card>

   {/* Applications Table */}
   <TableContainer component={Paper}>
    <Table>
     <TableHead>
      <TableRow>
       <TableCell>Applicant</TableCell>
       <TableCell>Contact</TableCell>
       <TableCell>Property</TableCell>
       <TableCell>Application Date</TableCell>
       <TableCell>Status</TableCell>
       <TableCell>Credit Score</TableCell>
       <TableCell>Monthly Income</TableCell>
       <TableCell>Actions</TableCell>
      </TableRow>
     </TableHead>
     <TableBody>
      {filteredApplications.map((application) => (
       <TableRow key={application.id}>
        <TableCell>
         <Typography variant="subtitle2">
          {application.applicantName}
         </Typography>
         <Typography variant="body2" color="textSecondary">
          {application.employmentStatus}
         </Typography>
        </TableCell>
        <TableCell>
         <Typography variant="body2">
          {application.email}
         </Typography>
         <Typography variant="body2" color="textSecondary">
          {application.phone}
         </Typography>
        </TableCell>
        <TableCell>{application.rentalProperty}</TableCell>
        <TableCell>{new Date(application.applicationDate).toLocaleDateString()}</TableCell>
        <TableCell>
         <Chip
          label={getStatusLabel(application.status)}
          color={getStatusColor(application.status) as any}
          size="small"
         />
        </TableCell>
        <TableCell>
         {application.creditScore ? (
          <Typography
           variant="body2"
           color={application.creditScore >= 700 ? 'success.main' : 
               application.creditScore >= 600 ? 'warning.main' : 'error.main'}
          >
           {application.creditScore}
          </Typography>
         ) : (
          <Typography variant="body2" color="textSecondary">
           N/A
          </Typography>
         )}
        </TableCell>
        <TableCell>
         {application.monthlyIncome ? (
          `$${application.monthlyIncome.toLocaleString()}`
         ) : (
          <Typography variant="body2" color="textSecondary">
           N/A
          </Typography>
         )}
        </TableCell>
        <TableCell>
         <Tooltip title="View Details">
          <IconButton
           component={Link}
           to={`/tenant-screening/applications/${application.id}`}
           size="small"
           color="primary"
          >
           <ViewIcon />
          </IconButton>
         </Tooltip>
         <Tooltip title="Edit">
          <IconButton
           size="small"
           color="secondary"
          >
           <EditIcon />
          </IconButton>
         </Tooltip>
         <Tooltip title="Delete">
          <IconButton
           size="small"
           color="error"
          >
           <DeleteIcon />
          </IconButton>
         </Tooltip>
        </TableCell>
       </TableRow>
      ))}
     </TableBody>
    </Table>
   </TableContainer>

   {filteredApplications.length === 0 && (
    <Box textAlign="center" py={4}>
     <Typography variant="h6" color="textSecondary">
      No applications found
     </Typography>
     <Typography variant="body2" color="textSecondary">
      {searchTerm || statusFilter ? 'Try adjusting your filters' : 'No applications have been submitted yet'}
     </Typography>
    </Box>
   )}
  </Box>
 );
};

export default TenantScreening;