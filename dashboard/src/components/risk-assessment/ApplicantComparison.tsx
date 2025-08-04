import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { ApplicantComparisonProps, RiskFactor, RiskFactorImpact } from '../../types/risk-assessment';
import { RiskLevelIndicator } from './RiskLevelIndicator';
// Change from:
import { ConfidenceIndicator } from '../../design-system/components/ai/ConfidenceIndicator';

// To:
import ConfidenceIndicator from '../../design-system/components/ai/ConfidenceIndicator';

/**
 * Applicant comparison interface component
 * Provides side-by-side comparison of multiple applicants with risk factors
 */
export const ApplicantComparison: React.FC<ApplicantComparisonProps> = ({
  comparison,
  onClose,
  onViewDetails,
}) => {
  const getImpactIcon = (impact: RiskFactorImpact) => {
    switch (impact) {
      case 'positive':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'negative':
        return <TrendingDownIcon color="error" fontSize="small" />;
      case 'neutral':
        return <TrendingFlatIcon color="action" fontSize="small" />;
      default:
        return null;
    }
  };

  const getImpactColor = (impact: RiskFactorImpact): 'success' | 'error' | 'default' => {
    switch (impact) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'error';
      case 'neutral':
      default:
        return 'default';
    }
  };

  const formatFactorValue = (value: number | string): string => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  };

  // Group factors by category for better organization
  const factorsByCategory = useMemo(() => {
    const categories: Record<string, string[]> = {};
    
    comparison.applicants.forEach(applicant => {
      applicant.factors.forEach(factor => {
        const category = factor.category || 'Other';
        if (!categories[category]) {
          categories[category] = [];
        }
        if (!categories[category].includes(factor.name)) {
          categories[category].push(factor.name);
        }
      });
    });

    return categories;
  }, [comparison.applicants]);

  // Helper function to get factor value for an applicant
  const getFactorForApplicant = (applicantId: string, factorName: string): RiskFactor | undefined => {
    const applicant = comparison.applicants.find(a => a.applicantId === applicantId);
    return applicant?.factors.find(f => f.name === factorName);
  };

  // Calculate best and worst performers for each factor
  const getFactorComparison = (factorName: string) => {
    const values = comparison.applicants.map(applicant => {
      const factor = applicant.factors.find(f => f.name === factorName);
      return {
        applicantId: applicant.applicantId,
        applicantName: applicant.applicantName,
        factor,
      };
    }).filter(item => item.factor);

    return values;
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      aria-labelledby="applicant-comparison-title"
    >
      <DialogTitle id="applicant-comparison-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="h2">
            Applicant Comparison ({comparison.applicants.length} applicants)
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close comparison"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Fair Housing Compliance Notice */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Fair Housing Compliance</AlertTitle>
          This comparison tool is designed to assist in objective evaluation based on financial 
          and rental criteria only. All decisions must comply with fair housing laws and regulations.
        </Alert>

        {/* Multi-Column Comparison Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Multi-Column Risk Assessment Comparison
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Comparison Metric
                      </Typography>
                    </TableCell>
                    {comparison.applicants.map((applicant) => (
                      <TableCell key={applicant.id} align="center" sx={{ minWidth: 200 }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {applicant.applicantName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {applicant.applicantId}
                          </Typography>
                          <Box mt={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => onViewDetails?.(applicant.applicantId)}
                              aria-label={`View detailed report for ${applicant.applicantName}`}
                            >
                              View Detailed Report
                            </Button>
                          </Box>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        Overall Risk Score
                      </Typography>
                    </TableCell>
                    {comparison.applicants.map((applicant) => (
                      <TableCell key={applicant.id} align="center">
                        <Typography 
                          variant="h5" 
                          fontWeight="bold"
                          color={`${applicant.riskLevel === 'low' ? 'success' : applicant.riskLevel === 'medium' ? 'warning' : 'error'}.main`}
                        >
                          {applicant.overallScore}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        Risk Level
                      </Typography>
                    </TableCell>
                    {comparison.applicants.map((applicant) => (
                      <TableCell key={applicant.id} align="center">
                        <RiskLevelIndicator
                          level={applicant.riskLevel}
                          size="medium"
                          showLabel
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        AI Confidence
                      </Typography>
                    </TableCell>
                    {comparison.applicants.map((applicant) => (
                      <TableCell key={applicant.id} align="center">
                        <ConfidenceIndicator
                          confidence={applicant.confidence}
                          size="small"
                          showLabel
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        Assessment Summary
                      </Typography>
                    </TableCell>
                    {comparison.applicants.map((applicant) => (
                      <TableCell key={applicant.id} align="center">
                        <Typography variant="body2" color="text.secondary">
                          {applicant.explanation}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Detailed Risk Factor Comparison - Multi-Column Layout */}
        {Object.entries(factorsByCategory).map(([category, factorNames]) => (
          <Card key={category} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                {category} Risk Factors
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          Risk Factor (Row)
                        </Typography>
                      </TableCell>
                      {comparison.applicants.map((applicant) => (
                        <TableCell key={applicant.id} align="center" sx={{ minWidth: 180 }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {applicant.applicantName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Column {comparison.applicants.findIndex(a => a.id === applicant.id) + 1}
                            </Typography>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {factorNames.map((factorName) => (
                      <TableRow 
                        key={factorName} 
                        hover
                        sx={{ 
                          '&:nth-of-type(odd)': { bgcolor: 'grey.25' },
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {factorName}
                          </Typography>
                        </TableCell>
                        {comparison.applicants.map((applicant) => {
                          const factor = getFactorForApplicant(applicant.applicantId, factorName);
                          return (
                            <TableCell 
                              key={applicant.id} 
                              align="center"
                              sx={{
                                bgcolor: factor ? 
                                  factor.impact === 'positive' ? 'success.light' :
                                  factor.impact === 'negative' ? 'error.light' :
                                  'warning.light'
                                  : 'inherit',
                                opacity: factor ? 0.1 : 1,
                                position: 'relative'
                              }}
                            >
                              {factor ? (
                                <Box 
                                  display="flex" 
                                  flexDirection="column" 
                                  alignItems="center" 
                                  gap={0.5}
                                  sx={{ position: 'relative', zIndex: 1 }}
                                >
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    {getImpactIcon(factor.impact)}
                                    <Chip
                                      label={formatFactorValue(factor.value)}
                                      size="small"
                                      color={getImpactColor(factor.impact)}
                                      variant="filled"
                                      sx={{ 
                                        fontWeight: 'bold',
                                        minWidth: 80
                                      }}
                                    />
                                  </Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                    Weight: {(factor.weight * 100).toFixed(0)}%
                                  </Typography>
                                  <Tooltip title={factor.description} arrow>
                                    <Typography 
                                      variant="caption" 
                                      color="text.secondary"
                                      sx={{ 
                                        cursor: 'help',
                                        textDecoration: 'underline dotted'
                                      }}
                                    >
                                      Details
                                    </Typography>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  N/A
                                </Typography>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))}

        {/* AI Recommendations */}
        {comparison.recommendations && comparison.recommendations.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Recommendations
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {comparison.recommendations.map((recommendation, index) => (
                  <Typography
                    key={index}
                    component="li"
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {recommendation}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close Comparison
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            // Export comparison data
            const dataStr = JSON.stringify(comparison, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `applicant-comparison-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export Comparison
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicantComparison;