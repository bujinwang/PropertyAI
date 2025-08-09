import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Compare as CompareIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Gavel as OverrideIcon,
} from '@mui/icons-material';
import { DashboardCard } from '../components/shared';
import { RiskFactorBreakdown } from '../components/risk-assessment/RiskFactorBreakdown';
import { ApplicantComparison } from '../components/risk-assessment/ApplicantComparison';
import { 
  RiskAssessment, 
  RiskAssessmentMetrics, 
  Applicant, 
  RiskLevel,
  ApplicantComparison as ApplicantComparisonType 
} from '../types/risk-assessment';

/**
 * PropertyAI Dashboard - AI Risk Assessment Dashboard
 * Main dashboard for AI-powered risk assessment with visualization and comparison features
 */
const AIRiskAssessmentDashboard: React.FC = () => {
  // State management
  const [metrics, setMetrics] = useState<RiskAssessmentMetrics | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<RiskAssessment | null>(null);
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ApplicantComparisonType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [filterRisk, setFilterRisk] = useState<RiskLevel | 'all'>('all');

  // Mock data for demonstration
  const mockMetrics: RiskAssessmentMetrics = {
    totalApplicants: 24,
    riskCategories: {
      low: 12,
      medium: 8,
      high: 4,
    },
    averageScore: 75,
    pendingReviews: 6,
    lastUpdated: new Date(),
  };

  const mockApplicants: Applicant[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      applicationDate: new Date('2024-01-15'),
      status: 'under_review',
      riskAssessment: {
        id: 'ra1',
        applicantId: '1',
        applicantName: 'John Smith',
        overallScore: 85,
        riskLevel: 'low',
        factors: [
          {
            id: 'f1',
            name: 'Credit Score',
            value: 750,
            weight: 0.3,
            impact: 'positive',
            description: 'Excellent credit history with consistent payments',
            category: 'Financial'
          },
          {
            id: 'f2',
            name: 'Income to Rent Ratio',
            value: 3.2,
            weight: 0.25,
            impact: 'positive',
            description: 'Income is 3.2x the monthly rent',
            category: 'Financial'
          },
          {
            id: 'f3',
            name: 'Employment History',
            value: '5 years',
            weight: 0.2,
            impact: 'positive',
            description: 'Stable employment for 5+ years',
            category: 'Employment'
          }
        ],
        explanation: 'Strong financial profile with excellent credit and stable income',
        confidence: 92,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        status: 'pending'
      }
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '(555) 234-5678',
      applicationDate: new Date('2024-01-14'),
      status: 'under_review',
      riskAssessment: {
        id: 'ra2',
        applicantId: '2',
        applicantName: 'Sarah Johnson',
        overallScore: 65,
        riskLevel: 'medium',
        factors: [
          {
            id: 'f4',
            name: 'Credit Score',
            value: 680,
            weight: 0.3,
            impact: 'neutral',
            description: 'Good credit score with minor late payments',
            category: 'Financial'
          },
          {
            id: 'f5',
            name: 'Income to Rent Ratio',
            value: 2.8,
            weight: 0.25,
            impact: 'neutral',
            description: 'Income is 2.8x the monthly rent',
            category: 'Financial'
          }
        ],
        explanation: 'Moderate risk profile with good financial standing',
        confidence: 78,
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14'),
        status: 'pending'
      }
    },
    {
      id: '3',
      name: 'Mike Davis',
      email: 'mike.davis@email.com',
      phone: '(555) 345-6789',
      applicationDate: new Date('2024-01-13'),
      status: 'under_review',
      riskAssessment: {
        id: 'ra3',
        applicantId: '3',
        applicantName: 'Mike Davis',
        overallScore: 45,
        riskLevel: 'high',
        factors: [
          {
            id: 'f6',
            name: 'Credit Score',
            value: 580,
            weight: 0.3,
            impact: 'negative',
            description: 'Below average credit with recent late payments',
            category: 'Financial'
          },
          {
            id: 'f7',
            name: 'Income to Rent Ratio',
            value: 2.1,
            weight: 0.25,
            impact: 'negative',
            description: 'Income is only 2.1x the monthly rent',
            category: 'Financial'
          }
        ],
        explanation: 'Higher risk profile requiring additional review',
        confidence: 85,
        createdAt: new Date('2024-01-13'),
        updatedAt: new Date('2024-01-13'),
        status: 'pending'
      }
    }
  ];

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMetrics(mockMetrics);
        setApplicants(mockApplicants);
      } catch (err) {
        setError('Failed to load risk assessment data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Event handlers
  const handleViewDetails = useCallback((applicant: Applicant) => {
    if (applicant.riskAssessment) {
      setSelectedApplicant(applicant.riskAssessment);
      setShowBreakdown(true);
    }
  }, []);

  const handleCompareApplicants = useCallback(() => {
    if (selectedApplicants.length >= 2) {
      const selectedAssessments = applicants
        .filter(a => selectedApplicants.includes(a.id) && a.riskAssessment)
        .map(a => a.riskAssessment!);
      
      setComparison({
        applicants: selectedAssessments,
        comparisonFactors: ['Credit Score', 'Income to Rent Ratio', 'Employment History'],
        recommendations: [
          'Consider John Smith as the primary candidate based on superior financial metrics',
          'Sarah Johnson presents moderate risk but acceptable for approval',
          'Mike Davis requires additional documentation and review'
        ]
      });
      setShowComparison(true);
    }
  }, [selectedApplicants, applicants]);

  const handleApplicantSelect = useCallback((applicantId: string) => {
    setSelectedApplicants(prev => 
      prev.includes(applicantId) 
        ? prev.filter(id => id !== applicantId)
        : [...prev, applicantId]
    );
  }, []);

  const handleOverrideDecision = useCallback(() => {
    if (overrideReason.trim()) {
      // Handle override logic here
      console.log('Override submitted:', overrideReason);
      setShowOverrideDialog(false);
      setOverrideReason('');
    }
  }, [overrideReason]);

  const getRiskLevelColor = (level: RiskLevel): 'success' | 'warning' | 'error' => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'success';
    }
  };

  const getRiskLevelIcon = (level: RiskLevel) => {
    switch (level) {
      case 'low': return <CheckCircleIcon color="success" />;
      case 'medium': return <WarningIcon color="warning" />;
      case 'high': return <ErrorIcon color="error" />;
      default: return <CheckCircleIcon color="success" />;
    }
  };

  const filteredApplicants = applicants.filter(applicant => {
    if (filterRisk === 'all') return true;
    return applicant.riskAssessment?.riskLevel === filterRisk;
  });

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          PropertyAI Dashboard
        </Typography>
        <Typography variant="h5" component="h2" color="primary" gutterBottom>
          AI Risk Assessment Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive risk analysis and applicant comparison powered by artificial intelligence
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Total Applicants" aiGenerated>
            <Typography variant="h3" color="primary">
              {metrics?.totalApplicants || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Applications under review
            </Typography>
          </DashboardCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Risk Score" aiGenerated>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h3" color="success.main">
                {metrics?.averageScore || 0}
              </Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Overall Risk Score
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={metrics?.averageScore || 0} 
                  color="success"
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </Box>
            </Box>
          </DashboardCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Risk Distribution">
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Low Risk</Typography>
                <Chip 
                  label={metrics?.riskCategories.low || 0} 
                  color="success" 
                  size="small" 
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Medium Risk</Typography>
                <Chip 
                  label={metrics?.riskCategories.medium || 0} 
                  color="warning" 
                  size="small" 
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">High Risk</Typography>
                <Chip 
                  label={metrics?.riskCategories.high || 0} 
                  color="error" 
                  size="small" 
                />
              </Box>
            </Box>
          </DashboardCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Pending Reviews">
            <Typography variant="h3" color="warning.main">
              {metrics?.pendingReviews || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Awaiting manual review
            </Typography>
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Risk Factor Visualization */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <DashboardCard 
            title="Risk Factor Visualization" 
            subtitle="Risk factor visualizations will be implemented here."
            aiGenerated
          >
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
              <AssessmentIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Risk Factor Charts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Interactive visualizations showing risk factor distributions, trends, and correlations
              </Typography>
            </Box>
          </DashboardCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <DashboardCard title="Comparative Analysis" aiGenerated>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Side-by-side applicant comparison will be implemented here.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<CompareIcon />}
                onClick={handleCompareApplicants}
                disabled={selectedApplicants.length < 2}
                fullWidth
                sx={{ mt: 2 }}
              >
                Compare Selected ({selectedApplicants.length})
              </Button>
            </Box>
          </DashboardCard>
        </Grid>
      </Grid>

      {/* AI Scoring Factors */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <DashboardCard 
            title="AI Scoring Factors" 
            subtitle="Detailed explanation of AI scoring factors will be implemented here."
            aiGenerated
          >
            <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Scoring Methodology
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Financial Factors (60%)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Credit score, income ratio, debt-to-income, payment history
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Employment (25%)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Employment stability, income verification, job history
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Rental History (15%)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Previous rental performance, references, eviction history
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Applicant List */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <DashboardCard 
            title="Applicant Risk Assessment"
            actions={
              <Box display="flex" gap={1}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Filter by Risk</InputLabel>
                  <Select
                    value={filterRisk}
                    label="Filter by Risk"
                    onChange={(e) => setFilterRisk(e.target.value as RiskLevel | 'all')}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="low">Low Risk</MenuItem>
                    <MenuItem value="medium">Medium Risk</MenuItem>
                    <MenuItem value="high">High Risk</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </Box>
            }
          >
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Typography variant="subtitle2">Select</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">Applicant</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">Risk Level</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">Score</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">Application Date</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">Status</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">Actions</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApplicants.map((applicant) => (
                    <TableRow key={applicant.id} hover>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedApplicants.includes(applicant.id)}
                          onChange={() => handleApplicantSelect(applicant.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {applicant.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {applicant.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {applicant.riskAssessment && getRiskLevelIcon(applicant.riskAssessment.riskLevel)}
                          <Chip
                            label={applicant.riskAssessment?.riskLevel || 'N/A'}
                            color={applicant.riskAssessment ? getRiskLevelColor(applicant.riskAssessment.riskLevel) : 'default'}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {applicant.riskAssessment?.overallScore || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {applicant.applicationDate.toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={applicant.status.replace('_', ' ')}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(applicant)}
                              disabled={!applicant.riskAssessment}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Override AI Decision */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'warning.light', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Override AI Decision
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manual override allows authorized personnel to approve or reject applications regardless of AI recommendation
        </Typography>
        <Button
          variant="contained"
          color="warning"
          startIcon={<OverrideIcon />}
          onClick={() => setShowOverrideDialog(true)}
          disabled={selectedApplicants.length !== 1}
        >
          Submit Override
        </Button>
      </Box>

      {/* Risk Factor Breakdown Modal */}
      {selectedApplicant && (
        <RiskFactorBreakdown
          assessment={selectedApplicant}
          open={showBreakdown}
          onClose={() => setShowBreakdown(false)}
          onApprove={(id) => console.log('Approved:', id)}
          onReject={(id, reason) => console.log('Rejected:', id, reason)}
        />
      )}

      {/* Applicant Comparison Modal */}
      {comparison && (
        <ApplicantComparison
          comparison={comparison}
          onClose={() => setShowComparison(false)}
          onViewDetails={(id) => console.log('View details:', id)}
        />
      )}

      {/* Override Decision Dialog */}
      <Dialog
        open={showOverrideDialog}
        onClose={() => setShowOverrideDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Override AI Decision</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Manual Override</AlertTitle>
            This action will override the AI recommendation. Please provide a detailed reason.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Override Reason"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Explain the reason for overriding the AI decision..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOverrideDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleOverrideDecision}
            disabled={!overrideReason.trim()}
          >
            Submit Override
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AIRiskAssessmentDashboard;
