import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, Tenant, Lease } from '../services/dashboardService';

const TenantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // For now, we'll get tenant from the list - in a real app, you'd have a getTenant endpoint
        const tenantsResponse = await dashboardService.getTenants(1, 100);
        const foundTenant = tenantsResponse.data.find((t: Tenant) => t.id === id);
        if (foundTenant) {
          setTenant(foundTenant);
          // Fetch leases associated with this tenant
          const leasesResponse = await dashboardService.getLeases(1, 100);
          const tenantLeases = leasesResponse.data.filter((l: Lease) => l.tenantId === id);
          setLeases(tenantLeases);
        } else {
          setError('Tenant not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch tenant details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getLeaseStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'error';
      case 'renewed': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !tenant) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">{error || 'Tenant not found'}</Alert>
        <Button component={Link} to="/tenants" variant="contained" sx={{ mt: 2 }}>
          Back to Tenants
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {tenant.name}
        </Typography>
        <Button component={Link} to="/tenants" variant="outlined">
          Back to Tenants
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} aria-label="tenant detail tabs">
        <Tab label="Overview" id="overview-tab" aria-controls="overview-panel" />
        <Tab label={`Leases (${leases.length})`} id="leases-tab" aria-controls="leases-panel" />
      </Tabs>

      {tabValue === 0 && (
        <Card sx={{ mt: 3 }} aria-labelledby="overview-tab">
          <CardContent>
            <Typography variant="h6" gutterBottom id="overview-panel">
              Tenant Overview
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography>{tenant.name}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography>{tenant.email}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                <Typography>{tenant.phone || 'Not provided'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Lease Start</Typography>
                <Typography>{tenant.leaseStart ? new Date(tenant.leaseStart).toLocaleDateString() : 'Not assigned'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Lease End</Typography>
                <Typography>{tenant.leaseEnd ? new Date(tenant.leaseEnd).toLocaleDateString() : 'Not assigned'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={tenant.status}
                  color={tenant.status === 'active' ? 'success' : tenant.status === 'pending' ? 'warning' : 'error'}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Unit ID</Typography>
                <Typography>{tenant.unitId || 'Not assigned'}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Box sx={{ mt: 3 }} aria-labelledby="leases-tab">
          <Typography variant="h6" id="leases-panel" gutterBottom>
            Associated Leases
          </Typography>
          <TableContainer component={Paper}>
            <Table aria-label="leases table">
              <TableHead>
                <TableRow>
                  <TableCell>Unit Address</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Rent Amount</TableCell>
                  <TableCell>Payment Frequency</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leases.map((lease) => (
                  <TableRow key={lease.id}>
                    <TableCell>{lease.unitAddress || 'N/A'}</TableCell>
                    <TableCell>{new Date(lease.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(lease.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>${lease.rentAmount.toLocaleString()}</TableCell>
                    <TableCell>{lease.paymentFrequency}</TableCell>
                    <TableCell>
                      <Chip
                        label={lease.status}
                        color={getLeaseStatusColor(lease.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        component={Link}
                        to={`/leases/${lease.id}`}
                        variant="outlined"
                        size="small"
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {leases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No leases found for this tenant
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Container>
  );
};

export default TenantDetail;