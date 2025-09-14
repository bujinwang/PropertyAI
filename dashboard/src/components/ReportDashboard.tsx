/**
 * ReportDashboard Component
 * Main interface for AI-powered report generation and management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as GenerateIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Preview as PreviewIcon,
  Settings as SettingsIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import reportingService from '../services/reportingService';
import {
  ReportTemplate,
  GeneratedReport,
  ReportGenerationRequest,
  ReportParameters,
  ReportInsights,
  ReportRecommendations,
  ReportCustomizationOptions,
  ReportVisualization,
  ReportFilter
} from '../types/reporting';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ReportDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [customizationOptions, setCustomizationOptions] = useState<ReportCustomizationOptions | null>(null);
  const [generationDialog, setGenerationDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [customizationDialog, setCustomizationDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Generation form state
  const [generationForm, setGenerationForm] = useState<ReportGenerationRequest>({
    templateId: '',
    parameters: {},
    format: 'pdf',
    emailDelivery: false,
    recipientEmails: []
  });

  // Preview state
  const [previewData, setPreviewData] = useState<{
    insights: ReportInsights[];
    recommendations: ReportRecommendations[];
    confidence: number;
  } | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadTemplates();
    loadReports();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templateData = await reportingService.getTemplates();
      setTemplates(templateData);
    } catch (error) {
      showSnackbar('Failed to load report templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const { reports: reportData } = await reportingService.getReports();
      setReports(reportData);
    } catch (error) {
      showSnackbar('Failed to load reports', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setGenerationForm(prev => ({
      ...prev,
      templateId: template.id
    }));
  };

  const handleGenerationDialogOpen = () => {
    if (!selectedTemplate) {
      showSnackbar('Please select a template first', 'warning');
      return;
    }
    setGenerationDialog(true);
  };

  const handleGenerationDialogClose = () => {
    setGenerationDialog(false);
    setGenerationForm({
      templateId: '',
      parameters: {},
      format: 'pdf',
      emailDelivery: false,
      recipientEmails: []
    });
  };

  const handlePreviewReport = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      const preview = await reportingService.previewReport(
        selectedTemplate.id,
        generationForm.parameters
      );
      setPreviewData(preview);
      setPreviewDialog(true);
    } catch (error) {
      showSnackbar('Failed to preview report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const result = await reportingService.generateReport(generationForm);
      showSnackbar(`Report generation started. ID: ${result.reportId}`, 'success');
      handleGenerationDialogClose();
      // Refresh reports list
      setTimeout(() => loadReports(), 2000);
    } catch (error) {
      showSnackbar('Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (report: GeneratedReport, format: 'pdf' | 'csv' | 'excel' | 'json') => {
    try {
      setLoading(true);
      const exportData = await reportingService.exportReport(report.id, format);

      // Create download link
      const url = window.URL.createObjectURL(exportData.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSnackbar(`Report exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      showSnackbar('Failed to export report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await reportingService.deleteReport(reportId);
      showSnackbar('Report deleted successfully', 'success');
      loadReports();
    } catch (error) {
      showSnackbar('Failed to delete report', 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'generating':
        return <CircularProgress size={20} />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'generating':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%', typography: 'body1' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          <ReportIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          AI-Powered Reporting Dashboard
        </Typography>

        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="report dashboard tabs">
            <Tab label="Templates" />
            <Tab label="Generated Reports" />
            <Tab label="Scheduled Reports" />
            <Tab label="Analytics" />
          </Tabs>

          {/* Templates Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {templates.map((template) => (
                <Grid item xs={12} sm={6} md={4} key={template.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedTemplate?.id === template.id ? 2 : 1,
                      borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider'
                    }}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip label={template.type} size="small" color="primary" />
                        <Chip label={template.category} size="small" color="secondary" />
                      </Box>
                      <Typography variant="body2">
                        Sections: {template.sections.length}
                      </Typography>
                      <Typography variant="body2">
                        Data Sources: {template.dataSources.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {selectedTemplate && (
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<GenerateIcon />}
                  onClick={handleGenerationDialogOpen}
                >
                  Generate Report
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={handlePreviewReport}
                >
                  Preview
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => setCustomizationDialog(true)}
                >
                  Customize
                </Button>
              </Box>
            )}
          </TabPanel>

          {/* Generated Reports Tab */}
          <TabPanel value={activeTab} index={1}>
            <List>
              {reports.map((report) => (
                <ListItem key={report.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(report.status)}
                        <Typography variant="subtitle1">
                          {report.templateName}
                        </Typography>
                        <Chip
                          label={report.status}
                          size="small"
                          color={getStatusColor(report.status) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Generated: {new Date(report.generatedAt).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {report.id} | Format: {report.format.toUpperCase()}
                        </Typography>
                        {report.downloadCount > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Downloads: {report.downloadCount}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Download PDF">
                      <IconButton
                        onClick={() => handleExportReport(report, 'pdf')}
                        disabled={report.status !== 'completed'}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download CSV">
                      <IconButton
                        onClick={() => handleExportReport(report, 'csv')}
                        disabled={report.status !== 'completed'}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDeleteReport(report.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </TabPanel>

          {/* Scheduled Reports Tab */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" gutterBottom>
              Scheduled Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scheduled reports feature coming soon...
            </Typography>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6" gutterBottom>
              Report Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analytics dashboard coming soon...
            </Typography>
          </TabPanel>
        </Paper>

        {/* Report Generation Dialog */}
        <Dialog open={generationDialog} onClose={handleGenerationDialogClose} maxWidth="md" fullWidth>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedTemplate?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedTemplate?.description}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={generationForm.format}
                      onChange={(e) => setGenerationForm(prev => ({
                        ...prev,
                        format: e.target.value as any
                      }))}
                    >
                      <MenuItem value="pdf">PDF</MenuItem>
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="excel">Excel</MenuItem>
                      <MenuItem value="json">JSON</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={generationForm.emailDelivery}
                        onChange={(e) => setGenerationForm(prev => ({
                          ...prev,
                          emailDelivery: e.target.checked
                        }))}
                      />
                    }
                    label="Email Delivery"
                  />
                </Grid>

                {generationForm.emailDelivery && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Recipient Emails"
                      placeholder="email1@example.com, email2@example.com"
                      value={generationForm.recipientEmails.join(', ')}
                      onChange={(e) => setGenerationForm(prev => ({
                        ...prev,
                        recipientEmails: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                      }))}
                      helperText="Comma-separated email addresses"
                    />
                  </Grid>
                )}

                {/* Date Range Parameters */}
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Start Date"
                    value={generationForm.parameters.dateRange?.start || null}
                    onChange={(date) => setGenerationForm(prev => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        dateRange: {
                          ...prev.parameters.dateRange,
                          start: date
                        }
                      }
                    }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="End Date"
                    value={generationForm.parameters.dateRange?.end || null}
                    onChange={(date) => setGenerationForm(prev => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        dateRange: {
                          ...prev.parameters.dateRange,
                          end: date
                        }
                      }
                    }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleGenerationDialogClose}>Cancel</Button>
            <Button onClick={handlePreviewReport} disabled={loading}>
              Preview
            </Button>
            <Button onClick={handleGenerateReport} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Generate'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Report Preview</DialogTitle>
          <DialogContent>
            {previewData && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  AI-Generated Insights
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Confidence Score: {(previewData.confidence * 100).toFixed(1)}%
                </Typography>

                {previewData.insights.map((insight, index) => (
                  <Accordion key={insight.id} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {insight.priority === 'high' && <WarningIcon color="error" />}
                        {insight.priority === 'medium' && <TrendingUpIcon color="warning" />}
                        <Typography variant="subtitle1">{insight.title}</Typography>
                        <Chip
                          label={insight.priority}
                          size="small"
                          color={insight.priority === 'high' ? 'error' : insight.priority === 'medium' ? 'warning' : 'default'}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {insight.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Impact: {insight.impact}/10 | Confidence: {(insight.confidence * 100).toFixed(1)}%
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Actionable Recommendations
                </Typography>

                {previewData.recommendations.map((rec, index) => (
                  <Card key={rec.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {rec.title}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {rec.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip
                          label={`Priority: ${rec.priority}`}
                          size="small"
                          color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'default'}
                        />
                        <Chip
                          label={`Effort: ${rec.effort}/5`}
                          size="small"
                        />
                        <Chip
                          label={`Timeline: ${rec.timeline}`}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Impact: {rec.impact}/10 | Confidence: {(rec.confidence * 100).toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialog(false)}>Close</Button>
            <Button onClick={() => {
              setPreviewDialog(false);
              handleGenerateReport();
            }} variant="contained">
              Generate Full Report
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportDashboard;