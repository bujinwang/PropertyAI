import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';
import { RiskHeatmap } from './RiskHeatmap';
import { RiskTrendChart } from './RiskTrendChart';
import { MitigationStrategies } from './MitigationStrategies';
import { RiskAlerts } from './RiskAlerts';

interface RiskAssessment {
  assessmentId: string;
  overallRiskScore: number;
  riskLevel: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  assessmentDate: string;
  nextAssessmentDate: string;
  dataQuality: number;
  riskFactors?: any;
  mitigationStrategies?: any[];
  trendData?: any;
}

interface PortfolioRisk {
  overallScore: number;
  riskLevel: string;
  confidence: number;
  criticalCount: number;
  highCount: number;
  riskFactors: any;
  mitigationStrategies: any[];
  dataQuality: number;
}

interface RiskAssessmentDashboardProps {
  onRefresh?: () => void;
}

const RiskAssessmentDashboard: React.FC<RiskAssessmentDashboardProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [portfolioRisk, setPortfolioRisk] = useState<PortfolioRisk | null>(null);
  const [propertyRisks, setPropertyRisks] = useState<RiskAssessment[]>([]);
  const [tenantRisks, setTenantRisks] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [assessmentDialog, setAssessmentDialog] = useState(false);

  // Risk level colors and icons
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#fbc02d';
      case 'low': return '#388e3c';
      case 'minimal': return '#1976d2';
      default: return '#757575';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical': return <ErrorIcon sx={{ color: '#d32f2f' }} />;
      case 'high': return <WarningIcon sx={{ color: '#f57c00' }} />;
      case 'medium': return <WarningIcon sx={{ color: '#fbc02d' }} />;
      case 'low': return <InfoIcon sx={{ color: '#388e3c' }} />;
      case 'minimal': return <InfoIcon sx={{ color: '#1976d2' }} />;
      default: return <InfoIcon />;
    }
  };

  const getRiskLabel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  // Fetch portfolio risk data
  const fetchPortfolioRisk = async () => {
    try {
      const response = await fetch('/api/risks/portfolio?detailed=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch portfolio risk data');
      }

      const data = await response.json();
      setPortfolioRisk(data.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio risk data');
    }
  };

  // Fetch property and tenant risk summaries
  const fetchEntityRisks = async () => {
    try {
      const [propertyResponse, tenantResponse] = await Promise.all([
        fetch('/api/risks/summary?entityType=property&period=30d', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/risks/summary?entityType=tenant&period=30d', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (propertyResponse.ok) {
        const propertyData = await propertyResponse.json();
        // Transform summary data to risk assessments format
        setPropertyRisks([propertyData.data]);
      }

      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json();
        setTenantRisks([tenantData.data]);
      }
    } catch (err) {
      console.error('Failed to fetch entity risks:', err);
    }
  };

  // Load all risk data
  const loadRiskData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchPortfolioRisk(),
        fetchEntityRisks()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load risk data');
    } finally {
      setLoading(false);
    }
  };

  // Trigger new risk assessment
  const triggerAssessment = async (entityType: string, entityId?: string) => {
    try {
      const response = await fetch('/api/risks/assess', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entityType,
          entityId: entityId || (entityType === 'portfolio' ? undefined : 'portfolio-main'),
          assessmentType: 'comprehensive'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger risk assessment');
      }

      const result = await response.json();

      // Refresh data after assessment
      await loadRiskData();

      return result;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Assessment failed');
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadRiskData();
    if (onRefresh) {
      onRefresh();
    }
  };

  // Handle assessment dialog
  const handleAssessmentDialog = () => {
    setAssessmentDialog(!assessmentDialog);
  };

  // Initial load
  useEffect(() => {
    loadRiskData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Risk Assessment Data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button
          size="small"
          onClick={handleRefresh}
          sx={{ ml: 2 }}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Risk Assessment Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive portfolio risk monitoring and mitigation strategies
          </Typography>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdated.toLocaleString()}
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<AssessmentIcon />}
            onClick={handleAssessmentDialog}
          >
            New Assessment
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Portfolio Overview Cards */}
      {portfolioRisk && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  {getRiskIcon(portfolioRisk.riskLevel)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Portfolio Risk
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ color: getRiskColor(portfolioRisk.riskLevel), fontWeight: 'bold' }}>
                  {portfolioRisk.overallScore.toFixed(1)}
                </Typography>
                <Chip
                  label={getRiskLabel(portfolioRisk.riskLevel)}
                  size="small"
                  sx={{
                    backgroundColor: getRiskColor(portfolioRisk.riskLevel),
                    color: 'white',
                    mt: 1
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <ErrorIcon sx={{ color: '#d32f2f' }} />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Critical Risks
                  </Typography>
                </Box>
                <Typography variant="h4" color="error" fontWeight="bold">
                  {portfolioRisk.criticalCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Require immediate attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <WarningIcon sx={{ color: '#f57c00' }} />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    High Risks
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                  {portfolioRisk.highCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Need urgent attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <ShieldIcon sx={{ color: '#1976d2' }} />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Confidence
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  {(portfolioRisk.confidence * 100).toFixed(0)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={portfolioRisk.confidence * 100}
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<ShieldIcon />} label="Risk Overview" />
          <Tab icon={<TimelineIcon />} label="Risk Trends" />
          <Tab icon={<WarningIcon />} label="Active Alerts" />
          <Tab icon={<AssessmentIcon />} label="Mitigation Strategies" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <RiskHeatmap
              portfolioRisk={portfolioRisk}
              propertyRisks={propertyRisks}
              tenantRisks={tenantRisks}
            />
          )}

          {activeTab === 1 && (
            <RiskTrendChart
              portfolioRisk={portfolioRisk}
              propertyRisks={propertyRisks}
              tenantRisks={tenantRisks}
            />
          )}

          {activeTab === 2 && (
            <RiskAlerts
              portfolioRisk={portfolioRisk}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 3 && (
            <MitigationStrategies
              mitigationStrategies={portfolioRisk?.mitigationStrategies || []}
              onActionTaken={handleRefresh}
            />
          )}
        </Box>
      </Paper>

      {/* Assessment Dialog */}
      <Dialog open={assessmentDialog} onClose={handleAssessmentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Trigger Risk Assessment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Choose the type of risk assessment to perform:
          </Typography>
          <List>
            <ListItem button onClick={() => triggerAssessment('portfolio')}>
              <ListItemIcon>
                <AssessmentIcon />
              </ListItemIcon>
              <ListItemText
                primary="Portfolio Assessment"
                secondary="Comprehensive assessment of all properties and tenants"
              />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => triggerAssessment('property')}>
              <ListItemIcon>
                <ShieldIcon />
              </ListItemIcon>
              <ListItemText
                primary="Property Assessment"
                secondary="Assess individual property risks"
              />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => triggerAssessment('tenant')}>
              <ListItemIcon>
                <WarningIcon />
              </ListItemIcon>
              <ListItemText
                primary="Tenant Assessment"
                secondary="Assess individual tenant risks"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssessmentDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RiskAssessmentDashboard;