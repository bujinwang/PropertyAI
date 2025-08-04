import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
 Box,
 Typography,
 Paper,
 Grid,
 Button,
 Chip,
 CircularProgress,
 Divider,
 Card,
 CardContent,
 List,
 ListItem,
 ListItemText,
 Dialog,
 DialogActions,
 DialogContent,
 DialogContentText,
 DialogTitle,
 TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import tenantScreeningService from '../services/tenantScreeningService';
import { Application } from '../types/tenantScreening';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
 pending: 'warning',
 approved: 'success',
 rejected: 'error',
 review: 'info',
 incomplete: 'default',
};

const ApplicationDetail: React.FC = () => {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const [application, setApplication] = useState<Application | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [openRejectDialog, setOpenRejectDialog] = useState(false);
 const [rejectionReason, setRejectionReason] = useState('');
 const [actionLoading, setActionLoading] = useState(false);

 useEffect(() => {
  const fetchApplication = async () => {
   if (!id) return;
   
   try {
    setLoading(true);
    const data = await tenantScreeningService.getApplicationById(id);
    setApplication(data);
    setError(null);
   } catch (err) {
    console.error(`Failed to fetch application ${id}:`, err);
    setError('Failed to load application details. Please try again later.');
    
    // For development: Add mock data when API fails
    if (process.env.NODE_ENV === 'development') {
     setApplication({
      id: id,
      propertyId: 'prop123',
      propertyName: 'Sunset Apartments',
      applicantName: 'John Doe',
      applicantEmail: 'john.doe@example.com',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      leaseTermMonths: 12,
      monthlyRent: 1500,
      securityDeposit: 1500,
      creditScore: 720,
      notes: 'Applicant has a pet cat.',
     });
    }
   } finally {
    setLoading(false);
   }
  };

  fetchApplication();
 }, [id]);

 const handleApprove = async () => {
  if (!id) return;
  
  try {
   setActionLoading(true);
   const updatedApplication = await tenantScreeningService.approveApplication(id);
   setApplication(updatedApplication);
  } catch (err) {
   console.error(`Failed to approve application ${id}:`, err);
   setError('Failed to approve application. Please try again later.');
  } finally {
   setActionLoading(false);
  }
 };

 const handleOpenRejectDialog = () => {
  setOpenRejectDialog(true);
 };

 const handleCloseRejectDialog = () => {
  setOpenRejectDialog(false);
 };

 const handleReject = async () => {
  if (!id) return;
  
  try {
   setActionLoading(true);
   const updatedApplication = await tenantScreeningService.rejectApplication(id, rejectionReason);
   setApplication(updatedApplication);
   handleCloseRejectDialog();
  } catch (err) {
   console.error(`Failed to reject application ${id}:`, err);
   setError('Failed to reject application. Please try again later.');
  } finally {
   setActionLoading(false);
  }
 };

 const handleDelete = async () => {
  if (!id) return;
  
  try {
   setActionLoading(true);
   await tenantScreeningService.deleteApplication(id);
   navigate('/tenant-screening');
  } catch (err) {
   console.error(`Failed to delete application ${id}:`, err);
   setError('Failed to delete application. Please try again later.');
  } finally {
   setActionLoading(false);
  }
 };

 const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
   year: 'numeric',
   month: 'long',
   day: 'numeric',
  });
 };

 if (loading) {
  return (
   <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
    <CircularProgress />
   </Box>
  );
 }

 if (!application) {
  return (
   <Box>
    <Typography variant="h5" color="error">
     Application not found
    </Typography>
    <Button
     component={RouterLink}
     to="/tenant-screening"
     variant="contained"
     sx={{ mt: 2 }}
    >
     Back to Applications
    </Button>
   </Box>
  );
 }

 return (
  <Box>
   {error && (
    <Typography color="error" sx={{ mb: 2 }}>
     {error}
    </Typography>
   )}

   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Typography variant="h4" component="h1">
     Application Details
    </Typography>
    <Box>
     <Button
      variant="outlined"
      startIcon={<EditIcon />}
      component={RouterLink}
      to={`/tenant-screening/applications/${id}/edit`}
      sx={{ mr: 1 }}
     >
      Edit
     </Button>
     <Button
      variant="outlined"
      color="error"
      startIcon={<DeleteIcon />}
      onClick={handleDelete}
      disabled={actionLoading}
     >
      Delete
     </Button>
    </Box>
   </Box>

   <Paper sx={{ p: 3, mb: 3 }}>
    <Grid container spacing={2}>
     <Grid xs={12} sm={6}>
      <Typography variant="subtitle1">Application ID</Typography>
      <Typography variant="body1" gutterBottom>{application.id}</Typography>
     </Grid>
     <Grid xs={12} sm={6}>
      <Typography variant="subtitle1">Status</Typography>
      <Chip
       label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
       color={statusColors[application.status] || 'default'}
       sx={{ fontWeight: 'bold' }}
      />
     </Grid>
     <Grid xs={12} sm={6}>
      <Typography variant="subtitle1">Property</Typography>
      <Typography variant="body1" gutterBottom>{application.propertyName || 'N/A'}</Typography>
     </Grid>
     <Grid xs={12} sm={6}>
      <Typography variant="subtitle1">Applicant</Typography>
      <Typography variant="body1" gutterBottom>{application.applicantName || 'N/A'}</Typography>
     </Grid>
     <Grid xs={12} sm={6}>
      <Typography variant="subtitle1">Email</Typography>
      <Typography variant="body1" gutterBottom>{application.applicantEmail || 'N/A'}</Typography>
     </Grid>
     <Grid xs={12} sm={6}>
      <Typography variant="subtitle1">Credit Score</Typography>
      <Typography variant="body1" gutterBottom>{application.creditScore || 'N/A'}</Typography>
     </Grid>
     <Grid xs={12} sm={6}>
      <Typography variant="subtitle1">Submitted Date</Typography>
      <Typography variant="body1" gutterBottom>{formatDate(application.submittedAt)}</Typography>
     </Grid>
     <Grid xs={12} sm={6}>
      <Typography variant="subtitle1">Move-in Date</Typography>
      <Typography variant="body1" gutterBottom>{application.moveInDate ? formatDate(application.moveInDate) : 'N/A'}</Typography>
     </Grid>
     <Grid xs={12} sm={6}>
      <Typography variant="subtitle1">Lease Term</Typography>
      <Typography variant="body1" gutterBottom>{application.leaseTermMonths ? `${application.leaseTermMonths} months` : 'N/A'}</Typography>
     </Grid>
     <Grid xs={12} sm={6}>
      <Typography variant="subtitle1">Monthly Rent</Typography>
      <Typography variant="body1" gutterBottom>{application.monthlyRent ? `$${application.monthlyRent.toLocaleString()}` : 'N/A'}</Typography>
     </Grid>
     <Grid xs={12} sm={6}>
      <Typography variant="subtitle1">Security Deposit</Typography>
      <Typography variant="body1" gutterBottom>{application.securityDeposit ? `$${application.securityDeposit.toLocaleString()}` : 'N/A'}</Typography>
     </Grid>
    </Grid>

    {application.notes && (
     <>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1">Notes</Typography>
      <Typography variant="body1" paragraph>{application.notes}</Typography>
     </>
    )}

    {application.rejectionReason && (
     <>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" color="error">Rejection Reason</Typography>
      <Typography variant="body1" paragraph>{application.rejectionReason}</Typography>
     </>
    )}

    <Divider sx={{ my: 2 }} />
    
    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
     {application.status === 'pending' && (
      <>
       <Button
        variant="contained"
        color="success"
        startIcon={<CheckCircleIcon />}
        onClick={handleApprove}
        disabled={actionLoading}
       >
        Approve
       </Button>
       <Button
        variant="contained"
        color="error"
        startIcon={<CancelIcon />}
        onClick={handleOpenRejectDialog}
        disabled={actionLoading}
       >
        Reject
       </Button>
       <Button
        variant="contained"
        color="primary"
        startIcon={<VerifiedUserIcon />}
        disabled={actionLoading}
       >
        Run Background Check
       </Button>
      </>
     )}
    </Box>
   </Paper>

   <Dialog open={openRejectDialog} onClose={handleCloseRejectDialog}>
    <DialogTitle>Reject Application</DialogTitle>
    <DialogContent>
     <DialogContentText>
      Please provide a reason for rejecting this application.
     </DialogContentText>
     <TextField
      autoFocus
      margin="dense"
      id="rejectionReason"
      label="Rejection Reason"
      type="text"
      fullWidth
      multiline
      rows={4}
      value={rejectionReason}
      onChange={(e) => setRejectionReason(e.target.value)}
     />
    </DialogContent>
    <DialogActions>
     <Button onClick={handleCloseRejectDialog}>Cancel</Button>
     <Button onClick={handleReject} color="error" disabled={!rejectionReason.trim()}>
      Reject
     </Button>
    </DialogActions>
   </Dialog>
  </Box>
 );
};

export default ApplicationDetail;
