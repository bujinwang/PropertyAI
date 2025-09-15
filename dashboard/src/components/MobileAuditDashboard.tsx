import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Assessment as AssessmentIcon,
  TouchApp as TouchAppIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Speed as SpeedIcon,
  Accessibility as AccessibilityIcon
} from '@mui/icons-material';
import MobileAudit, { MobileAuditResult } from '../utils/mobileAudit';

const MobileAuditDashboard: React.FC = () => {
  const [auditResult, setAuditResult] = useState<MobileAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAuditTime, setLastAuditTime] = useState<Date | null>(null);

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      const result = await MobileAudit.performAudit();
      setAuditResult(result);
      setLastAuditTime(new Date());

      // Log results to console for debugging
      MobileAudit.logResults(result);
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    // Auto-run audit on component mount
    runAudit();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircleIcon color="success" />;
    if (score >= 60) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const renderAuditSection = (
    title: string,
    icon: React.ReactNode,
    data: any,
    issues: string[] = []
  ) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>

        {issues.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {issues.length} issue{issues.length !== 1 ? 's' : ''} found
            </Typography>
          </Alert>
        )}

        <List dense>
          {Object.entries(data).map(([key, value]) => {
            if (key === 'issues') return null;
            return (
              <ListItem key={key}>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>

        {issues.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" color="error" gutterBottom>
              Issues to Address:
            </Typography>
            {issues.map((issue, index) => (
              <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                • {issue}
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <AssessmentIcon sx={{ mr: 2, fontSize: 32 }} />
          <Box>
            <Typography variant="h4" component="h1">
              Mobile Compatibility Audit
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive assessment of mobile responsiveness and user experience
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          {lastAuditTime && (
            <Typography variant="body2" color="text.secondary">
              Last audit: {lastAuditTime.toLocaleTimeString()}
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={runAudit}
            disabled={isAuditing}
            startIcon={<AssessmentIcon />}
          >
            {isAuditing ? 'Running Audit...' : 'Run Audit'}
          </Button>
        </Box>
      </Box>

      {isAuditing && (
        <Box mb={3}>
          <Typography variant="body2" mb={1}>Running mobile compatibility audit...</Typography>
          <LinearProgress />
        </Box>
      )}

      {auditResult && (
        <>
          {/* Overall Score */}
          <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Overall Mobile Score
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on viewport, touch targets, responsive design, performance, and accessibility
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h3" color={`${getScoreColor(auditResult.overallScore)}.main`}>
                    {auditResult.overallScore}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    out of 100
                  </Typography>
                  <Box mt={1}>
                    {getScoreIcon(auditResult.overallScore)}
                  </Box>
                </Box>
              </Box>

              <Box mt={2}>
                <Chip
                  label={
                    auditResult.overallScore >= 80 ? 'Excellent' :
                    auditResult.overallScore >= 60 ? 'Good' : 'Needs Improvement'
                  }
                  color={getScoreColor(auditResult.overallScore)}
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Detailed Sections */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              {renderAuditSection(
                'Viewport Configuration',
                <PhoneAndroidIcon />,
                auditResult.viewport,
                auditResult.viewport.issues
              )}

              {renderAuditSection(
                'Touch Targets',
                <TouchAppIcon />,
                auditResult.touchTargets,
                auditResult.touchTargets.issues.map(issue =>
                  `${issue.element} (${issue.size.width}x${issue.size.height}px) - ${issue.selector}`
                )
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
              {renderAuditSection(
                'Responsive Design',
                <PhoneAndroidIcon />,
                auditResult.responsiveDesign,
                auditResult.responsiveDesign.issues
              )}

              {renderAuditSection(
                'Performance',
                <SpeedIcon />,
                auditResult.performance,
                auditResult.performance.issues
              )}

              {renderAuditSection(
                'Accessibility',
                <AccessibilityIcon />,
                auditResult.accessibility,
                auditResult.accessibility.issues
              )}
            </Box>
          </Box>

          {/* Recommendations */}
          {auditResult.recommendations.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📋 Action Items & Recommendations
                </Typography>
                <List>
                  {auditResult.recommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            {index + 1}. {recommendation}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Touch Target Details */}
          {auditResult.touchTargets.issues.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🔍 Touch Target Details
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Elements that don't meet the 44px minimum touch target size (WCAG AA requirement)
                </Typography>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      {auditResult.touchTargets.issues.length} Non-compliant Touch Targets
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {auditResult.touchTargets.issues.map((issue, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight="bold">
                                {issue.element} - {issue.size.width}×{issue.size.height}px
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {issue.selector}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!auditResult && !isAuditing && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Ready to Run Mobile Audit
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Click the "Run Audit" button to perform a comprehensive assessment of mobile compatibility
            </Typography>
            <Button
              variant="contained"
              onClick={runAudit}
              startIcon={<AssessmentIcon />}
              size="large"
            >
              Start Mobile Audit
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default MobileAuditDashboard;