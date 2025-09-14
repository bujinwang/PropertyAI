import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';

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

interface RiskHeatmapProps {
  portfolioRisk: PortfolioRisk | null;
  propertyRisks: RiskAssessment[];
  tenantRisks: RiskAssessment[];
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({
  portfolioRisk,
  propertyRisks,
  tenantRisks
}) => {
  // Risk level colors and configurations
  const riskConfig = useMemo(() => ({
    critical: {
      color: '#d32f2f',
      bgColor: '#ffebee',
      icon: <ErrorIcon sx={{ color: '#d32f2f' }} />,
      label: 'Critical'
    },
    high: {
      color: '#f57c00',
      bgColor: '#fff3e0',
      icon: <WarningIcon sx={{ color: '#f57c00' }} />,
      label: 'High'
    },
    medium: {
      color: '#fbc02d',
      bgColor: '#fffde7',
      icon: <WarningIcon sx={{ color: '#fbc02d' }} />,
      label: 'Medium'
    },
    low: {
      color: '#388e3c',
      bgColor: '#e8f5e8',
      icon: <CheckCircleIcon sx={{ color: '#388e3c' }} />,
      label: 'Low'
    },
    minimal: {
      color: '#1976d2',
      bgColor: '#e3f2fd',
      icon: <InfoIcon sx={{ color: '#1976d2' }} />,
      label: 'Minimal'
    }
  }), []);

  // Calculate risk distribution
  const riskDistribution = useMemo(() => {
    const distribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      minimal: 0
    };

    // Count property risks
    propertyRisks.forEach(risk => {
      if (risk.riskLevel && distribution.hasOwnProperty(risk.riskLevel)) {
        distribution[risk.riskLevel as keyof typeof distribution]++;
      }
    });

    // Count tenant risks
    tenantRisks.forEach(risk => {
      if (risk.riskLevel && distribution.hasOwnProperty(risk.riskLevel)) {
        distribution[risk.riskLevel as keyof typeof distribution]++;
      }
    });

    return distribution;
  }, [propertyRisks, tenantRisks]);

  // Get risk level for score
  const getRiskLevel = (score: number): keyof typeof riskConfig => {
    if (score >= 4.0) return 'critical';
    if (score >= 3.0) return 'high';
    if (score >= 2.0) return 'medium';
    if (score >= 1.0) return 'low';
    return 'minimal';
  };

  // Render risk card
  const renderRiskCard = (title: string, risk: RiskAssessment, type: 'property' | 'tenant') => {
    const config = riskConfig[risk.riskLevel];

    return (
      <Card
        key={risk.assessmentId}
        sx={{
          backgroundColor: config.bgColor,
          border: `2px solid ${config.color}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3
          }
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" mb={1}>
            <Avatar sx={{ bgcolor: config.color, mr: 1 }}>
              {type === 'property' ? <BusinessIcon /> : <PersonIcon />}
            </Avatar>
            <Box flex={1}>
              <Typography variant="subtitle2" noWrap>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(risk.assessmentDate).toLocaleDateString()}
              </Typography>
            </Box>
            {config.icon}
          </Box>

          <Box mb={1}>
            <Typography variant="h5" sx={{ color: config.color, fontWeight: 'bold' }}>
              {risk.overallRiskScore.toFixed(1)}
            </Typography>
            <Chip
              label={config.label}
              size="small"
              sx={{
                backgroundColor: config.color,
                color: 'white',
                fontSize: '0.7rem'
              }}
            />
          </Box>

          <Box mb={1}>
            <Typography variant="caption" color="text.secondary">
              Confidence: {(risk.confidence * 100).toFixed(0)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={risk.confidence * 100}
              sx={{
                height: 4,
                borderRadius: 2,
                mt: 0.5,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: config.color
                }
              }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            Next: {new Date(risk.nextAssessmentDate).toLocaleDateString()}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  // Render risk distribution chart
  const renderRiskDistribution = () => {
    const total = Object.values(riskDistribution).reduce((sum, count) => sum + count, 0);

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Risk Distribution Overview
        </Typography>

        <Grid container spacing={2}>
          {Object.entries(riskDistribution).map(([level, count]) => {
            const config = riskConfig[level as keyof typeof riskConfig];
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';

            return (
              <Grid item xs={6} sm={4} md={2.4} key={level}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: config.bgColor,
                    border: `1px solid ${config.color}`,
                    textAlign: 'center'
                  }}
                >
                  <Box display="flex" justifyContent="center" mb={1}>
                    {config.icon}
                  </Box>
                  <Typography variant="h4" sx={{ color: config.color, fontWeight: 'bold' }}>
                    {count}
                  </Typography>
                  <Typography variant="body2" sx={{ color: config.color }}>
                    {config.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {percentage}%
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Total Entities Assessed: {total}
          </Typography>
        </Box>
      </Paper>
    );
  };

  return (
    <Box>
      {/* Risk Distribution Overview */}
      {renderRiskDistribution()}

      {/* Portfolio Risk Summary */}
      {portfolioRisk && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Portfolio Risk Summary
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h3" sx={{
                  color: riskConfig[getRiskLevel(portfolioRisk.overallScore)].color,
                  fontWeight: 'bold'
                }}>
                  {portfolioRisk.overallScore.toFixed(1)}
                </Typography>
                <Typography variant="h6">
                  Overall Risk Score
                </Typography>
                <Chip
                  label={riskConfig[getRiskLevel(portfolioRisk.overallScore)].label}
                  sx={{
                    backgroundColor: riskConfig[getRiskLevel(portfolioRisk.overallScore)].color,
                    color: 'white',
                    mt: 1
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h3" color="error" fontWeight="bold">
                  {portfolioRisk.criticalCount}
                </Typography>
                <Typography variant="h6">
                  Critical Risks
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Require immediate attention
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h3" sx={{ color: '#f57c00' }} fontWeight="bold">
                  {portfolioRisk.highCount}
                </Typography>
                <Typography variant="h6">
                  High Risks
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Need urgent attention
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Property Risks */}
      {propertyRisks.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Property Risk Assessments
          </Typography>

          <Grid container spacing={2}>
            {propertyRisks.slice(0, 6).map((risk, index) => (
              <Grid item xs={12} sm={6} md={4} key={risk.assessmentId}>
                {renderRiskCard(`Property ${index + 1}`, risk, 'property')}
              </Grid>
            ))}
          </Grid>

          {propertyRisks.length > 6 && (
            <Box mt={2} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Showing 6 of {propertyRisks.length} properties
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Tenant Risks */}
      {tenantRisks.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tenant Risk Assessments
          </Typography>

          <Grid container spacing={2}>
            {tenantRisks.slice(0, 6).map((risk, index) => (
              <Grid item xs={12} sm={6} md={4} key={risk.assessmentId}>
                {renderRiskCard(`Tenant ${index + 1}`, risk, 'tenant')}
              </Grid>
            ))}
          </Grid>

          {tenantRisks.length > 6 && (
            <Box mt={2} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Showing 6 of {tenantRisks.length} tenants
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Empty State */}
      {propertyRisks.length === 0 && tenantRisks.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Risk Assessments Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Run a portfolio assessment to view risk data
          </Typography>
        </Paper>
      )}
    </Box>
  );
};