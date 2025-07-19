import React, { useState } from 'react';
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
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { RiskFactorBreakdownProps, RiskFactor, RiskFactorImpact } from '../../types/risk-assessment';
import { ConfidenceIndicator } from '../../design-system/components/ai/ConfidenceIndicator';
import { ExplanationTooltip } from '../../design-system/components/ai/ExplanationTooltip';

/**
 * Detailed risk factor breakdown modal/drawer
 * Provides transparent explanations of risk scores and individual factors
 */
export const RiskFactorBreakdown: React.FC<RiskFactorBreakdownProps> = ({
  assessment,
  open,
  onClose,
  onApprove,
  onReject,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const getImpactIcon = (impact: RiskFactorImpact) => {
    switch (impact) {
      case 'positive':
        return <TrendingUpIcon color="success" />;
      case 'negative':
        return <TrendingDownIcon color="error" />;
      case 'neutral':
        return <TrendingFlatIcon color="action" />;
      default:
        return <InfoIcon color="action" />;
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

  const getRiskLevelIcon = () => {
    switch (assessment.riskLevel) {
      case 'low':
        return <CheckCircleIcon color="success" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'high':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  const getRiskLevelColor = (): 'success' | 'warning' | 'error' => {
    switch (assessment.riskLevel) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'success';
    }
  };

  const formatFactorValue = (value: number | string): string => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  };

  const calculateWeightedScore = (factor: RiskFactor): number => {
    if (typeof factor.value === 'number') {
      return factor.value * factor.weight;
    }
    return 0;
  };

  const groupedFactors = assessment.factors.reduce((groups, factor) => {
    const category = factor.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(factor);
    return groups;
  }, {} as Record<string, RiskFactor[]>);

  const handleApprove = () => {
    onApprove?.(assessment.id);
    onClose();
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject?.(assessment.id, rejectionReason);
      onClose();
      setRejectionReason('');
      setShowRejectionForm(false);
    }
  };

  const handleShowRejectionForm = () => {
    setShowRejectionForm(true);
  };

  const handleCancelRejection = () => {
    setShowRejectionForm(false);
    setRejectionReason('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="risk-breakdown-title"
    >
      <DialogTitle id="risk-breakdown-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" component="h2">
              Risk Assessment Details - {assessment.applicantName}
            </Typography>
            {getRiskLevelIcon()}
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close risk breakdown"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Fair Housing Compliance Notice */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Fair Housing Compliance</AlertTitle>
          This assessment is based solely on objective financial and rental criteria. 
          All decisions must comply with fair housing laws and regulations.
        </Alert>

        {/* Overall Score Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h3" color={`${getRiskLevelColor()}.main`}>
                    {assessment.overallScore}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Risk Score
                  </Typography>
                  <Chip
                    label={`${assessment.riskLevel.toUpperCase()} RISK`}
                    color={getRiskLevelColor()}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <ConfidenceIndicator
                    confidence={assessment.confidence}
                    size="large"
                    showLabel
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    AI Confidence Level
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Assessment Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {assessment.explanation}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Last updated: {assessment.updatedAt.toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Risk Factors by Category */}
        {Object.entries(groupedFactors).map(([category, factors]) => (
          <Card key={category} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {category}
              </Typography>
              <List dense>
                {factors.map((factor) => (
                  <ListItem key={factor.id} divider>
                    <ListItemIcon>
                      {getImpactIcon(factor.impact)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight="medium">
                            {factor.name}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={formatFactorValue(factor.value)}
                              size="small"
                              color={getImpactColor(factor.impact)}
                              variant="outlined"
                            />
                            <ExplanationTooltip
                              title="Factor Weight"
                              content={`This factor contributes ${(factor.weight * 100).toFixed(1)}% to the overall risk score. Weighted contribution: ${calculateWeightedScore(factor).toFixed(1)} points.`}
                            >
                              <Typography variant="caption" color="text.secondary">
                                Weight: {(factor.weight * 100).toFixed(1)}%
                              </Typography>
                            </ExplanationTooltip>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box mt={1}>
                          <Typography variant="body2" color="text.secondary">
                            {factor.description}
                          </Typography>
                          <Box mt={1}>
                            <LinearProgress
                              variant="determinate"
                              value={factor.weight * 100}
                              color={getImpactColor(factor.impact)}
                              sx={{ height: 4, borderRadius: 2 }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))}

        {/* AI Methodology Explanation */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              How This Assessment Was Generated
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This risk assessment uses machine learning algorithms trained on historical rental data 
              to evaluate applicant profiles. The model considers multiple objective factors including 
              credit history, income verification, employment stability, and rental history.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Important:</strong> This assessment is a tool to assist in decision-making and 
              should not be the sole basis for rental decisions. All decisions must comply with fair 
              housing laws and consider individual circumstances.
            </Typography>
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">
                Model Version: 2.1.0 | Last Trained: {new Date().toLocaleDateString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {!showRejectionForm ? (
          <>
            <Button onClick={onClose} color="inherit">
              Close
            </Button>
            {assessment.status === 'pending' && (
              <>
                <Button
                  onClick={handleShowRejectionForm}
                  color="error"
                  variant="outlined"
                >
                  Reject Assessment
                </Button>
                <Button
                  onClick={handleApprove}
                  color="success"
                  variant="contained"
                >
                  Approve Assessment
                </Button>
              </>
            )}
          </>
        ) : (
          <Box width="100%" display="flex" flexDirection="column" gap={2}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this assessment..."
              required
            />
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={handleCancelRejection} color="inherit">
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                color="error"
                variant="contained"
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </Button>
            </Box>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RiskFactorBreakdown;