import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import tenantScreeningService from '../services/tenantScreeningService';
import { Application } from '../types/tenantScreening';
import ScreeningAlerts from '../components/tenant-screening/ScreeningAlerts';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  review: 'info',
  incomplete: 'default',
};

const ApplicationsList: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const data = await tenantScreeningService.getApplications();
        setApplications(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
        setError('Failed to load applications. Please try again later.');
        
        // For development: Add mock data when API fails
        if (process.env.NODE_ENV === 'development') {
          setApplications([
            {
              id: '1',
              propertyId: 'prop123',
              propertyName: 'Sunset Apartments',
              applicantName: 'John Doe',
              applicantEmail: 'john.doe@example.com',
              status: 'pending',
              submittedAt: new Date().toISOString(),
              creditScore: 720,
            },
            {
              id: '2',
              propertyId: 'prop456',
              propertyName: 'Lakeside Condos',
              applicantName: 'Jane Smith',
              applicantEmail: 'jane.smith@example.com',
              status: 'approved',
              submittedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              creditScore: 780,
            },
            {
              id: '3',
              propertyId: 'prop789',
              propertyName: 'Downtown Lofts',
              applicantName: 'Bob Johnson',
              applicantEmail: 'bob.johnson@example.com',
              status: 'rejected',
              submittedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
              creditScore: 580,
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  return (
    <div>
      <ScreeningAlerts />
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Tenant Applications
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/tenant-screening/applications/new"
          >
            New Application
          </Button>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Property</TableCell>
                <TableCell>Applicant</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Credit Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.length > 0 ? (
                applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>{application.id}</TableCell>
                    <TableCell>{application.propertyName}</TableCell>
                    <TableCell>{application.applicantName}</TableCell>
                    <TableCell>{formatDate(application.submittedAt)}</TableCell>
                    <TableCell>{application.creditScore || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        color={statusColors[application.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        component={RouterLink}
                        to={`/tenant-screening/applications/${application.id}`}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No applications found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </div>
  );
};

export default ApplicationsList;
