/**
 * Compliance Dashboard Component
 * Comprehensive compliance monitoring and reporting interface
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Gavel as GavelIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import reportingService from '../services/reportingService';

interface ComplianceReport {
  period: { startDate?: string; endDate?: string };
  auditSummary: Array<{ action: string; count: number }>;
  complianceIssues: number;
  complianceDetails: any[];
  dataSensitivityStats: Array<{ dataSensitivity: string; count: number }>;
  generatedAt: string;
}

interface ComplianceIssue {
  rule: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  details?: Record<string, any>;
}

const ComplianceDashboard: React.FC = () => {
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ComplianceIssue | null>(null);

  useEffect(() => {
    loadComplianceReport();
  }, []);

  const loadComplianceReport = async () => {
    try {
      setLoading(true);
      const report = await reportingService.getComplianceReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        reportType: 'detailed'
      });
      setComplianceReport(report);
    } catch (error) {
      console.error('Error loading compliance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewIssueDetails = (issue: ComplianceIssue) => {
    setSelectedIssue(issue);
    setDetailsDialog(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <ErrorIcon color="error" />;
      case 'medium': return <WarningIcon color="warning" />;
      case 'low': return <InfoIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  const getDataSensitivityColor = (level: string) => {
    switch (level) {
      case 'restricted': return 'error';
      case 'confidential': return 'warning';
      case 'internal': return 'info';
      default: return 'default';
    }
  };

  const renderComplianceOverview = () => {
    if (!complianceReport) return null;

    const totalActions = complianceReport.auditSummary.reduce((sum, item) => sum + item.count, 0);
    const highRiskActions = complianceReport.auditSummary.filter(item =>
      ['deleted', 'exported', 'modified'].includes(item.action)
    ).reduce((sum, item) => sum + item.count, 0);

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Actions</Typography>
              </Box>
              <Typography variant="h4">{totalActions}</Typography>
              <Typography variant="body2" color="text.secondary">
                In selected period
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SecurityIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">High Risk</Typography>
              </Box>
              <Typography variant="h4">{highRiskActions}</Typography>
              <Typography variant="body2" color="text.secondary">
                Sensitive operations
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <GavelIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Issues Found</Typography>
              </Box>
              <Typography variant="h4">{complianceReport.complianceIssues}</Typography>
              <Typography variant="body2" color="text.secondary">
                Compliance violations
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Last Updated</Typography>
              </Box>
              <Typography variant="body2">
                {new Date(complianceReport.generatedAt).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  };

  const renderAuditSummary = () => {
    if (!complianceReport) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Audit Activity Summary
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell>Risk Level</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {complianceReport.auditSummary.map((item) => (
                  <TableRow key={item.action}>
                    <TableCell>{item.action.replace('_', ' ')}</TableCell>
                    <TableCell align="right">{item.count}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          ['deleted', 'exported', 'modified'].includes(item.action) ? 'High' :
                          ['viewed', 'created'].includes(item.action) ? 'Low' : 'Medium'
                        }
                        color={
                          ['deleted', 'exported', 'modified'].includes(item.action) ? 'error' :
                          ['viewed', 'created'].includes(item.action) ? 'success' : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderDataSensitivityStats = () => {
    if (!complianceReport) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Sensitivity Distribution
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {complianceReport.dataSensitivityStats.map((stat) => (
              <Chip
                key={stat.dataSensitivity}
                label={`${stat.dataSensitivity}: ${stat.count}`}
                color={getDataSensitivityColor(stat.dataSensitivity) as any}
                variant="outlined"
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderComplianceIssues = () => {
    if (!complianceReport || complianceReport.complianceIssues === 0) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Compliance Issues ({complianceReport.complianceIssues})
          </Typography>
          <List>
            {complianceReport.complianceDetails.map((issue, index) => (
              <ListItem key={index} divider>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  {getSeverityIcon(issue.severity)}
                </Box>
                <ListItemText
                  primary={issue.message}
                  secondary={`Rule: ${issue.rule} | Severity: ${issue.severity}`}
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    onClick={() => handleViewIssueDetails(issue)}
                  >
                    View Details
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Compliance Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: 'small' } }}
            />
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadComplianceReport}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {complianceReport ? (
          <>
            {renderComplianceOverview()}
            {renderAuditSummary()}
            {renderDataSensitivityStats()}
            {renderComplianceIssues()}

            {complianceReport.complianceIssues === 0 && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="h6">All Clear! 🎉</Typography>
                <Typography>
                  No compliance issues found in the selected time period.
                  All report operations are compliant with security and data protection policies.
                </Typography>
              </Alert>
            )}
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <Box sx={{ textAlign: 'center' }}>
              <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No compliance data available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click refresh to load the latest compliance report
              </Typography>
            </Box>
          </Box>
        )}

        {/* Issue Details Dialog */}
        <Dialog
          open={detailsDialog}
          onClose={() => setDetailsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Compliance Issue Details</DialogTitle>
          <DialogContent>
            {selectedIssue && (
              <Box sx={{ pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getSeverityIcon(selectedIssue.severity)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {selectedIssue.severity.toUpperCase()} SEVERITY
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedIssue.message}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Rule: {selectedIssue.rule}
                </Typography>

                {selectedIssue.details && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Additional Details
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(selectedIssue.details, null, 2)}
                      </pre>
                    </Paper>
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ComplianceDashboard;