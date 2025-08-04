import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Description,
  Schedule,
  TrendingUp,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  AccessTime
} from '@mui/icons-material';
import { VerificationState, VerificationDocument } from '../../types/document-verification';
import ConfidenceIndicator from '../../design-system/components/ai/ConfidenceIndicator';
import AIGeneratedContent from '../../design-system/components/ai/AIGeneratedContent';

interface StatusDetailsPanelProps {
  verificationState: VerificationState;
}

const StatusDetailsPanel: React.FC<StatusDetailsPanelProps> = ({
  verificationState
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'in_review': return 'warning';
      case 'rejected': return 'error';
      case 'submitted': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle color="success" />;
      case 'in_review': return <Warning color="warning" />;
      case 'rejected': return <ErrorIcon color="error" />;
      case 'submitted': return <Info color="info" />;
      default: return <Description />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (targetDate: Date) => {
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return `${diffDays} days remaining`;
    }
  };

  const progressPercentage = (verificationState.currentStep / verificationState.totalSteps) * 100;
  const documentsVerified = verificationState.documents.filter(doc => doc.status === 'verified').length;
  const documentsTotal = verificationState.documents.length;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Description sx={{ mr: 1 }} />
          <Typography variant="h6" component="h2">
            Verification Status Details
          </Typography>
          <Chip
            label={verificationState.status.replace('_', ' ').toUpperCase()}
            color={getStatusColor(verificationState.status)}
            sx={{ ml: 2 }}
          />
        </Box>

        <Grid container spacing={3}>
          {/* Overall Progress */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Overall Progress
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={progressPercentage}
                    size={60}
                    thickness={4}
                    sx={{
                      color: progressPercentage === 100 ? 'success.main' : 'primary.main',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round'
                      }
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="caption" component="div" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      {Math.round(progressPercentage)}%
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 6,
                        backgroundColor: progressPercentage === 100 ? 'success.main' : 'primary.main'
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Step {verificationState.currentStep} of {verificationState.totalSteps} completed
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Confidence Score */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Verification Confidence
              </Typography>
              <AIGeneratedContent
                confidence={verificationState.confidence}
                explanation="AI confidence score based on document quality, completeness, and consistency analysis"
                variant="outlined"
              >
                <ConfidenceIndicator
                  confidence={verificationState.confidence}
                  size="large"
                  showTooltip={true}
                  explanation="This score reflects the AI's confidence in the verification based on document analysis"
                />
              </AIGeneratedContent>
            </Box>
          </Grid>

          {/* Timeline Information */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Timeline
              </Typography>
              <List dense>
                <ListItem sx={{ 
                  backgroundColor: verificationState.estimatedCompletion < new Date() ? 'error.light' : 'primary.light',
                  borderRadius: 1,
                  mb: 1
                }}>
                  <ListItemIcon>
                    <Schedule color={verificationState.estimatedCompletion < new Date() ? 'error' : 'primary'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Estimated Completion
                      </Typography>
                    }
                    secondary={formatDate(verificationState.estimatedCompletion)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AccessTime />
                  </ListItemIcon>
                  <ListItemText
                    primary="Time Remaining"
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{ 
                          fontWeight: 'bold',
                          color: verificationState.estimatedCompletion < new Date() ? 'error.main' : 'success.main'
                        }}
                      >
                        {getTimeRemaining(verificationState.estimatedCompletion)}
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Updated"
                    secondary={formatDate(verificationState.lastUpdated)}
                  />
                </ListItem>
              </List>
            </Box>
          </Grid>

          {/* Document Summary */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Document Summary
              </Typography>
              <Box sx={{ mb: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                    <CircularProgress
                      variant="determinate"
                      value={(documentsVerified / documentsTotal) * 100}
                      size={40}
                      thickness={4}
                      sx={{
                        color: documentsVerified === documentsTotal ? 'success.main' : 'warning.main'
                      }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="caption" component="div" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                        {documentsVerified}/{documentsTotal}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {documentsVerified} of {documentsTotal} documents verified
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(documentsVerified / documentsTotal) * 100}
                      color={documentsVerified === documentsTotal ? 'success' : 'warning'}
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>
              </Box>
              
              <List dense>
                {verificationState.documents.map((document) => (
                  <ListItem key={document.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getStatusIcon(document.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={document.name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={document.status.replace('_', ' ')}
                            size="small"
                            color={getStatusColor(document.status)}
                            variant="outlined"
                          />
                          {document.confidence && (
                            <ConfidenceIndicator
                              confidence={document.confidence}
                              size="small"
                              showTooltip={true}
                              explanation={document.aiAnalysis}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* AI Analysis Summary */}
        <AIGeneratedContent
          confidence={verificationState.confidence}
          explanation="AI-powered analysis of your verification status and recommendations"
          variant="filled"
        >
          <Typography variant="subtitle1" gutterBottom>
            AI Analysis Summary
          </Typography>
          <Typography variant="body2" paragraph>
            Based on the current document analysis, your verification is progressing well. 
            The AI has identified {verificationState.requiredActions.filter(a => !a.completed).length} 
            action{verificationState.requiredActions.filter(a => !a.completed).length !== 1 ? 's' : ''} 
            that require your attention to complete the verification process.
          </Typography>
          
          {verificationState.confidence < 70 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                The current confidence score is below optimal levels. Completing the required actions 
                will help improve the verification confidence and speed up the process.
              </Typography>
            </Alert>
          )}
          
          {verificationState.confidence >= 85 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Excellent! Your documents show high confidence scores. The verification process 
                should complete smoothly within the estimated timeframe.
              </Typography>
            </Alert>
          )}
        </AIGeneratedContent>
      </CardContent>
    </Card>
  );
};

export default StatusDetailsPanel;