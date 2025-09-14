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
  IconButton,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { dashboardService, Property, Unit, Lease } from '../services/dashboardService';
import { marketDataService, PricingRecommendation, CompetitiveAnalysis } from '../services/marketDataService';
import UnitForm from '../components/UnitForm';
import UnitsList from '../components/UnitsList';
import BulkUnitForm from '../components/BulkUnitForm';
import AssignmentModal from '../components/AssignmentModal';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [openForm, setOpenForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [openBulkForm, setOpenBulkForm] = useState(false);

  // For assignment
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [assignMode, setAssignMode] = useState<'assign' | 'unassign'>('assign');
  const [currentUnitId, setCurrentUnitId] = useState<string | undefined>();

  // For market intelligence
  const [pricingRecommendations, setPricingRecommendations] = useState<PricingRecommendation | null>(null);
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState<CompetitiveAnalysis | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const propertyData = await dashboardService.getProperty(id);
        setProperty(propertyData);

        const unitsData = await dashboardService.getUnitsByProperty(id);
        setUnits(unitsData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch property details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const refetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const propertyData = await dashboardService.getProperty(id);
      setProperty(propertyData);

      const unitsData = await dashboardService.getUnitsByProperty(id);
      setUnits(unitsData);

      // Refresh leases
      const refreshedLeasesData = await dashboardService.getLeases(1, 100);
      const refreshedPropertyLeases = refreshedLeasesData.data.filter((lease: Lease) =>
        unitsData.some((unit: Unit) => unit.id === lease.unitId)
      );
      setLeases(refreshedPropertyLeases);

      // Fetch leases for this property's units
      const leasesData = await dashboardService.getLeases(1, 100);
      const propertyLeases = leasesData.data.filter((lease: Lease) =>
        unitsData.some((unit: Unit) => unit.id === lease.unitId)
      );
      setLeases(propertyLeases);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (unit?: Unit) => {
    setEditingUnit(unit || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingUnit(null);
  };

  const handleFormSuccess = () => {
    refetchData();
    handleCloseForm();
  };

  const handleDelete = async (unitId: string) => {
    try {
      await dashboardService.deleteUnit(unitId);
      refetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete unit');
    }
  };

  const handleOpenDelete = (unitId: string) => {
    setDeletingUnitId(unitId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingUnitId) {
      handleDelete(deletingUnitId);
    }
    setDeleteDialogOpen(false);
    setDeletingUnitId(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeletingUnitId(null);
  };

  const handleOpenBulk = () => {
    setOpenBulkForm(true);
  };

  const handleCloseBulk = () => {
    setOpenBulkForm(false);
  };

  const handleBulkSuccess = () => {
    refetchData();
    handleCloseBulk();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchMarketData = async () => {
    if (!id) return;

    setMarketLoading(true);
    try {
      const [pricing, analysis] = await Promise.all([
        marketDataService.getPricingRecommendations(id),
        marketDataService.getCompetitiveAnalysis(id)
      ]);

      setPricingRecommendations(pricing);
      setCompetitiveAnalysis(analysis);
    } catch (err: any) {
      console.error('Error fetching market data:', err);
    } finally {
      setMarketLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !property) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">{error || 'Property not found'}</Alert>
        <Button component={Link} to="/properties" variant="contained" sx={{ mt: 2 }}>
          Back to Properties
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {property.title}
        </Typography>
        <Button component={Link} to={`/properties/${id}/edit`} variant="outlined" startIcon={<AddIcon />}>
          Edit Property
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} aria-label="property detail tabs">
        <Tab label="Overview" id="overview-tab" aria-controls="overview-panel" />
        <Tab label={`Units (${units.length})`} id="units-tab" aria-controls="units-panel" />
        <Tab label={`Tenants (${units.filter(u => u.occupancyStatus === 'occupied').length})`} id="tenants-tab" aria-controls="tenants-panel" />
        <Tab label="Market Intelligence" icon={<TrendingUpIcon />} iconPosition="start" id="market-tab" aria-controls="market-panel" />
      </Tabs>

      {tabValue === 0 && (
        <Card sx={{ mt: 3 }} aria-labelledby="overview-tab">
          <CardContent>
            <Typography variant="h6" gutterBottom id="overview-panel">
              Property Overview
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                <Typography>{`${property.address}, ${property.city}, ${property.state} ${property.zipCode}`}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Typography>{property.propertyType}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Typography>{property.status}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Total Units</Typography>
                <Typography>{property.totalUnits}</Typography>
              </Box>
              {property.description && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography>{property.description}</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Box sx={{ mt: 3 }} aria-labelledby="units-tab">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" id="units-panel">
              Units Management ({units.length} units)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<AddCircleIcon />} onClick={handleOpenBulk}>
                Bulk Add Units
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
                Add Unit
              </Button>
            </Box>
          </Box>

          <UnitsList
            units={units}
            propertyId={id!}
            onEdit={handleOpenForm}
            onDelete={handleOpenDelete}
          />

          <UnitForm
            open={openForm}
            onClose={handleCloseForm}
            propertyId={id!}
            unitId={editingUnit?.id}
            initialValues={editingUnit || undefined}
            onSuccess={handleFormSuccess}
          />

          <BulkUnitForm
            open={openBulkForm}
            onClose={handleCloseBulk}
            propertyId={id!}
            onSuccess={handleBulkSuccess}
          />

          <Dialog
            open={deleteDialogOpen}
            onClose={handleCancelDelete}
            aria-labelledby="confirm-delete-title"
          >
            <DialogTitle id="confirm-delete-title">Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this unit? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelDelete}>Cancel</Button>
              <Button onClick={handleConfirmDelete} color="error" variant="contained">
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {tabValue === 2 && (
        <Box sx={{ mt: 3 }} aria-labelledby="tenants-tab">
          <Typography variant="h6" id="tenants-panel" gutterBottom>
            Tenant Assignments
          </Typography>
          <TableContainer component={Paper}>
            <Table aria-label="tenants table">
              <TableHead>
                <TableRow>
                  <TableCell>Unit Number</TableCell>
                  <TableCell>Tenant Name</TableCell>
                  <TableCell>Lease Start</TableCell>
                  <TableCell>Lease End</TableCell>
                  <TableCell>Rent Amount</TableCell>
                  <TableCell>Lease Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {units.filter(u => u.occupancyStatus === 'occupied').map((unit) => {
                  const unitLease = leases.find(lease => lease.unitId === unit.id);
                  return (
                    <TableRow key={unit.id}>
                      <TableCell>{unit.unitNumber}</TableCell>
                      <TableCell>{unitLease?.tenantName || 'Assigned Tenant'}</TableCell>
                      <TableCell>{unitLease ? new Date(unitLease.startDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{unitLease ? new Date(unitLease.endDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{unitLease ? `$${unitLease.rentAmount.toLocaleString()}` : 'N/A'}</TableCell>
                      <TableCell>
                        {unitLease ? (
                          <Chip
                            label={unitLease.status}
                            color={unitLease.status === 'active' ? 'success' : unitLease.status === 'expired' ? 'error' : 'warning'}
                            size="small"
                          />
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => {
                            setCurrentUnitId(unit.id);
                            setAssignMode('unassign');
                            setOpenAssignModal(true);
                          }}
                          color="secondary"
                          size="small"
                          aria-label="Unassign tenant"
                        >
                          <AssignmentIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tabValue === 3 && (
        <Box sx={{ mt: 3 }} aria-labelledby="market-tab">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" id="market-panel">
              Market Intelligence
            </Typography>
            <Button
              variant="contained"
              startIcon={<AssessmentIcon />}
              onClick={fetchMarketData}
              disabled={marketLoading}
            >
              {marketLoading ? 'Analyzing...' : 'Get Market Insights'}
            </Button>
          </Box>

          {marketLoading && (
            <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Analyzing market data...</Typography>
            </Box>
          )}

          {pricingRecommendations && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1 }} />
                  Pricing Recommendations
                </Typography>

                {pricingRecommendations.recommendations.map((rec, index) => (
                  <Alert
                    key={index}
                    severity={rec.confidence > 80 ? 'success' : rec.confidence > 60 ? 'warning' : 'info'}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="subtitle2">{rec.action}</Typography>
                    <Typography variant="body2">{rec.reasoning}</Typography>
                    <Box mt={1}>
                      <Typography variant="caption">
                        Current: ${rec.currentRent} |
                        Market: ${rec.marketAverage} |
                        Confidence: {rec.confidence}%
                      </Typography>
                    </Box>
                  </Alert>
                ))}

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Market Trend: {pricingRecommendations.marketData.marketTrend} ({pricingRecommendations.marketData.trendPercentage > 0 ? '+' : ''}{pricingRecommendations.marketData.trendPercentage}%)
                </Typography>
              </CardContent>
            </Card>
          )}

          {competitiveAnalysis && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssessmentIcon sx={{ mr: 1 }} />
                  Competitive Analysis
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="subtitle2" color="text.secondary">Market Position</Typography>
                    <Chip
                      label={competitiveAnalysis.marketPosition.toUpperCase()}
                      color={
                        competitiveAnalysis.marketPosition === 'premium' ? 'success' :
                        competitiveAnalysis.marketPosition === 'value' ? 'warning' : 'info'
                      }
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="subtitle2" color="text.secondary">Price vs Market</Typography>
                    <Typography variant="h6" sx={{
                      color: competitiveAnalysis.marketDifference > 0 ? 'success.main' : 'error.main'
                    }}>
                      {competitiveAnalysis.marketDifference > 0 ? '+' : ''}{competitiveAnalysis.marketDifference}%
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="subtitle2" color="text.secondary">Comparable Properties</Typography>
                    <Typography variant="h6">
                      {competitiveAnalysis.comparableProperties.length}
                    </Typography>
                  </Box>
                </Box>

                {competitiveAnalysis.insights.map((insight, index) => (
                  <Alert key={index} severity="info" sx={{ mb: 2 }}>
                    {insight}
                  </Alert>
                ))}

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Vacancy Rate: {competitiveAnalysis.marketData.vacancyRate}% |
                  Source: {competitiveAnalysis.marketData.source} |
                  Updated: {new Date(competitiveAnalysis.marketData.lastUpdated).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          )}

          {!pricingRecommendations && !competitiveAnalysis && !marketLoading && (
            <Alert severity="info">
              Click "Get Market Insights" to analyze pricing recommendations and competitive positioning for this property.
            </Alert>
          )}
        </Box>
      )}

      <AssignmentModal
        open={openAssignModal}
        onClose={() => setOpenAssignModal(false)}
        unitId={currentUnitId}
        mode={assignMode}
        propertyId={id!}
        tenantId={undefined}
        onSubmit={(data) => {
          console.log('Assignment data:', data); // Placeholder
          setOpenAssignModal(false);
          setCurrentUnitId(undefined);
          refetchData(); // Refresh data
        }}
      />

      <Box sx={{ mt: 3 }}>
        <Button component={Link} to="/properties" variant="outlined">
          Back to Properties
        </Button>
      </Box>
    </Container>
  );
};

export default PropertyDetail;