/**
 * AI Reporting Dashboard
 * Main interface for AI-powered report generation, management, and delivery
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
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
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import reportingService from '../services/reportingService';
import {
  ReportTemplate,
  GeneratedReport,
  ReportGenerationRequest,
  ReportInsights,
  ReportRecommendations
} from '../types/reporting';
import AuditTrailViewer from './AuditTrailViewer';
import ComplianceDashboard from './ComplianceDashboard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reporting-tabpanel-${index}`}
      aria-labelledby={`reporting-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AIReportingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [generationDialog, setGenerationDialog] = useState(false);
  const [emailDialog, setEmailDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Generation form state
  const [generationForm, setGenerationForm] = useState<ReportGenerationRequest>({
    templateId: '',
    parameters: {},
    format: 'pdf',
    emailDelivery: false,
    recipientEmails: []
  });

  // Email delivery form state
  const [emailForm, setEmailForm] = useState({
    recipientEmails: [] as string[],
    subject: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    includeInsights: true,
    includeRecommendations: true
  });

  // Audit viewer state
  const [showAuditViewer, setShowAuditViewer] = useState(false);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');

  useEffect(() => {
    loadTemplates();
    loadReports();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await reportingService.getTemplates();
      setTemplates(data);
    } catch (error) {
      showSnackbar('Failed to load report templates', 'error');
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const { reports: reportsData } = await reportingService.getReports(
        statusFilter || undefined,
        templateFilter || undefined,
        20,
        0
      );
      setReports(reportsData);
    } catch (error) {
      showSnackbar('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
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
    setGenerationDialog(true);
  };

  const handleGenerateReport = async () => {
    if (!generationForm.templateId) {
      showSnackbar('Please select a template', 'warning');
      return;
    }

    try {
      setLoading(true);
      const result = await reportingService.generateReport(generationForm);
      showSnackbar(`Report generation started. ID: ${result.reportId}`, 'success');

      // Wait for completion and refresh
      setTimeout(() => {
        loadReports();
      }, 2000);

      setGenerationDialog(false);
      resetGenerationForm();
    } catch (error) {
      showSnackbar('Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailDelivery = async () => {
    if (!selectedReport || emailForm.recipientEmails.length === 0) {
      showSnackbar('Please select a report and add recipients', 'warning');
      return;
    }

    try {
      setLoading(true);
      const result = await reportingService.deliverReportByEmail(
        selectedReport.id,
        emailForm
      );

      const successCount = result.successfulDeliveries;
      const failCount = result.failedDeliveries;

      if (successCount > 0) {
        showSnackbar(`Report delivered to ${successCount} recipient(s)`, 'success');
      }
      if (failCount > 0) {
        showSnackbar(`Failed to deliver to ${failCount} recipient(s)`, 'warning');
      }

      setEmailDialog(false);
      resetEmailForm();
    } catch (error) {
      showSnackbar('Failed to deliver report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (report: GeneratedReport, format: 'pdf' | 'csv' | 'excel' | 'json') => {
    try {
      setLoading(true);
      const exportResult = await reportingService.exportReport(report.id, format);

      // Create download link
      const url = window.URL.createObjectURL(exportResult.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportResult.filename;
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

  const resetGenerationForm = () => {
    setGenerationForm({
      templateId: '',
      parameters: {},
      format: 'pdf',
      emailDelivery: false,
      recipientEmails: []
    });
    setSelectedTemplate(null);
  };

  const resetEmailForm = () => {
    setEmailForm({
      recipientEmails: [],
      subject: '',
      message: '',
      priority: 'normal',
      includeInsights: true,
      includeRecommendations: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'generating': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      case 'generating': return <CircularProgress size={20} />;
      default: return <InfoIcon />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchTerm ||
      report.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || report.status === statusFilter;
    const matchesTemplate = !templateFilter || report.templateId === templateFilter;

    return matchesSearch && matchesStatus && matchesTemplate;
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%', typography: 'body1' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="reporting tabs">
            <Tab
              icon={<AnalyticsIcon />}
              label="Templates"
              id="reporting-tab-0"
              aria-controls="reporting-tabpanel-0"
            />
            <Tab
              icon={<HistoryIcon />}
              label="Reports"
              id="reporting-tab-1"
              aria-controls="reporting-tabpanel-1"
            />
            <Tab
              icon={<ScheduleIcon />}
              label="Scheduled"
              id="reporting-tab-2"
              aria-controls="reporting-tabpanel-2"
            />
            <Tab
              icon={<SecurityIcon />}
              label="Compliance"
              id="reporting-tab-3"
              aria-controls="reporting-tabpanel-3"
            />
          </Tabs>
        </Box>

        {/* Templates Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {templates.map((template) => (
              <Box key={template.id} sx={{ width: { xs: '100%', sm: '48%', md: '30%' } }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={template.category}
                        size="small"
                        color="primary"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={template.type}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Sections:</strong> {template.sections?.join(', ') || 'Default'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Data Sources:</strong> {template.dataSources?.join(', ') || 'Multiple'}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      Generate Report
                    </Button>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>
        </TabPanel>

        {/* Reports Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                <TextField
                  fullWidth
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 20%' } }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="generating">Generating</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 20%' } }}>
                <FormControl fullWidth>
                  <InputLabel>Template</InputLabel>
                  <Select
                    value={templateFilter}
                    label="Template"
                    onChange={(e) => setTemplateFilter(e.target.value)}
                  >
                    <MenuItem value="">All Templates</MenuItem>
                    {templates.map(template => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 15%' } }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadReports}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredReports.map((report) => (
              <Card key={report.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" component="div">
                        {report.templateName} Report
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {report.id} | Generated: {new Date(report.generatedAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={getStatusIcon(report.status)}
                        label={report.status}
                        color={getStatusColor(report.status) as any}
                        size="small"
                      />
                    </Box>
                  </Box>

                  {report.metadata?.insights && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>AI Insights:</strong> {report.metadata.insights.length} insights generated
                      </Typography>
                      <Typography variant="body2">
                        <strong>Confidence:</strong> {Math.round((report.metadata.confidence || 0) * 100)}%
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {report.status === 'completed' && (
                      <>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleExportReport(report, 'pdf')}
                        >
                          PDF
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleExportReport(report, 'csv')}
                        >
                          CSV
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EmailIcon />}
                          onClick={() => {
                            setSelectedReport(report);
                            setEmailDialog(true);
                          }}
                        >
                          Email
                        </Button>
                      </>
                    )}
                    <Button
                      size="small"
                      startIcon={<HistoryIcon />}
                      onClick={() => {
                        setSelectedReport(report);
                        setShowAuditViewer(true);
                      }}
                    >
                      Audit
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>

        {/* Scheduled Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Scheduled Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scheduled report functionality coming soon...
          </Typography>
        </TabPanel>

        {/* Compliance Tab */}
        <TabPanel value={activeTab} index={3}>
          <ComplianceDashboard />
        </TabPanel>

        {/* Report Generation Dialog */}
        <Dialog
          open={generationDialog}
          onClose={() => setGenerationDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Generate AI Report</DialogTitle>
          <DialogContent>
            {selectedTemplate && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6">{selectedTemplate.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTemplate.description}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={generationForm.format}
                      label="Format"
                      onChange={(e) => setGenerationForm(prev => ({
                        ...prev,
                        format: e.target.value as 'pdf' | 'csv' | 'excel' | 'json'
                      }))}
                    >
                      <MenuItem value="pdf">PDF</MenuItem>
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="excel">Excel</MenuItem>
                      <MenuItem value="json">JSON</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 100%' }}>
                  <TextField
                    fullWidth
                    label="Custom Parameters (JSON)"
                    multiline
                    rows={3}
                    placeholder='{"dateRange": {"start": "2024-01-01", "end": "2024-12-31"}}'
                    value={JSON.stringify(generationForm.parameters, null, 2)}
                    onChange={(e) => {
                      try {
                        const params = JSON.parse(e.target.value);
                        setGenerationForm(prev => ({ ...prev, parameters: params }));
                      } catch (error) {
                        // Invalid JSON, keep current value
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenerationDialog(false)}>Cancel</Button>
            <Button
              onClick={handleGenerateReport}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Email Delivery Dialog */}
        <Dialog
          open={emailDialog}
          onClose={() => setEmailDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Deliver Report by Email</DialogTitle>
          <DialogContent>
            {selectedReport && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6">{selectedReport.templateName} Report</Typography>
                <Typography variant="body2" color="text.secondary">
                  Generated: {new Date(selectedReport.generatedAt).toLocaleString()}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Recipient Emails (comma-separated)"
                multiline
                rows={2}
                placeholder="user1@example.com, user2@example.com"
                value={emailForm.recipientEmails.join(', ')}
                onChange={(e) => {
                  const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email);
                  setEmailForm(prev => ({ ...prev, recipientEmails: emails }));
                }}
              />
              <TextField
                fullWidth
                label="Subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder={`AI Report: ${selectedReport?.templateName || ''} Report`}
              />
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={3}
                value={emailForm.message}
                onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Please find your AI-generated report attached."
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={emailForm.priority}
                      label="Priority"
                      onChange={(e) => setEmailForm(prev => ({
                        ...prev,
                        priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent'
                      }))}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                  <FormControl fullWidth>
                    <InputLabel>Include Insights</InputLabel>
                    <Select
                      value={emailForm.includeInsights}
                      label="Include Insights"
                      onChange={(e) => setEmailForm(prev => ({
                        ...prev,
                        includeInsights: e.target.value === 'true'
                      }))}
                    >
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                  <FormControl fullWidth>
                    <InputLabel>Include Recommendations</InputLabel>
                    <Select
                      value={emailForm.includeRecommendations}
                      label="Include Recommendations"
                      onChange={(e) => setEmailForm(prev => ({
                        ...prev,
                        includeRecommendations: e.target.value === 'true'
                      }))}
                    >
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEmailDialog(false)}>Cancel</Button>
            <Button
              onClick={handleEmailDelivery}
              variant="contained"
              disabled={loading || emailForm.recipientEmails.length === 0}
              startIcon={loading ? <CircularProgress size={20} /> : <EmailIcon />}
            >
              {loading ? 'Sending...' : 'Send Report'}
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

        {/* Audit Trail Viewer */}
        {showAuditViewer && selectedReport && (
          <AuditTrailViewer
            reportId={selectedReport.id}
            onClose={() => {
              setShowAuditViewer(false);
              setSelectedReport(null);
            }}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default AIReportingDashboard;