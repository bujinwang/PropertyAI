import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Slideshow as PowerPointIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  dashboardService,
  ReportTemplate,
  Report,
  AnalyticsFilters,
} from '../services/dashboardService';
import reportingService from '../services/reportingService';

interface ReportGeneratorProps {
  onReportGenerated?: (report: Report) => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onReportGenerated }) => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: '30d',
  });
  const [reportName, setReportName] = useState('');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  
  // Scheduling state
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [scheduleTime, setScheduleTime] = useState(new Date());
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(1); // Monday
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState(1);
  const [recipients, setRecipients] = useState<string>('');
  const [scheduling, setScheduling] = useState(false);

  React.useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const loadedTemplates = await dashboardService.getReportTemplates();
      setTemplates(loadedTemplates);
    } catch (err) {
      setError('Failed to load report templates');
      console.error('Template loading error:', err);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !reportName.trim()) {
      setError('Please select a template and enter a report name');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const reportData = {
        templateId: selectedTemplate.id,
        name: reportName,
        type: selectedTemplate.type,
        format,
        filters,
      };

      const report = await dashboardService.generateReport(reportData);

      if (onReportGenerated) {
        onReportGenerated(report);
      }

      // Reset form
      setReportName('');
      setSelectedTemplate(null);

    } catch (err) {
      setError('Failed to generate report');
      console.error('Report generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const blob = await dashboardService.downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download report');
      console.error('Download error:', err);
    }
  };

  const handleScheduleReport = () => {
    if (!selectedTemplate || !reportName.trim()) {
      setError('Please select a template and enter a report name before scheduling');
      return;
    }
    setShowScheduleDialog(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedTemplate) return;

    const recipientEmails = recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (recipientEmails.length === 0) {
      setError('Please enter at least one recipient email address');
      return;
    }

    try {
      setScheduling(true);
      setError(null);

      const scheduleData = {
        templateId: selectedTemplate.id,
        parameters: {
          name: reportName,
          filters,
          format,
        },
        schedule: {
          frequency: scheduleFrequency,
          time: `${scheduleTime.getHours().toString().padStart(2, '0')}:${scheduleTime.getMinutes().toString().padStart(2, '0')}`,
          dayOfWeek: scheduleFrequency === 'weekly' ? scheduleDayOfWeek : undefined,
          dayOfMonth: scheduleFrequency === 'monthly' || scheduleFrequency === 'quarterly' ? scheduleDayOfMonth : undefined,
          recipients: recipientEmails,
        },
      };

      await reportingService.scheduleReport(scheduleData);

      // Reset form and close dialog
      setShowScheduleDialog(false);
      setReportName('');
      setRecipients('');
      setError(null);
      
      // Show success message (you could use a snackbar here)
      alert('Report scheduled successfully!');

    } catch (err) {
      setError('Failed to schedule report');
      console.error('Schedule error:', err);
    } finally {
      setScheduling(false);
    }
  };

  const getFormatIcon = (formatType: string) => {
    switch (formatType) {
      case 'pdf':
        return <PdfIcon />;
      case 'excel':
        return <ExcelIcon />;
      case 'powerpoint':
        return <PowerPointIcon />;
      default:
        return <DownloadIcon />;
    }
  };

  const getTemplateDescription = (template: ReportTemplate) => {
    const typeLabels = {
      'monthly-financial': 'Monthly Financial Report',
      'occupancy': 'Occupancy Analysis',
      'maintenance': 'Maintenance Summary',
      'tenant': 'Tenant Report',
      'custom': 'Custom Report',
    };

    return typeLabels[template.type] || template.type;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Report Generator
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Template Selection */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Select Report Template
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Report Template</InputLabel>
                <Select
                  value={selectedTemplate?.id || ''}
                  label="Report Template"
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value);
                    setSelectedTemplate(template || null);
                  }}
                >
                  {templates.map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      <Box>
                        <Typography variant="subtitle2">
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getTemplateDescription(template)}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedTemplate && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTemplate.description}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption">Fields included:</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {selectedTemplate.fields.map(field => (
                        <Chip
                          key={field}
                          label={field}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Report Configuration */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Report Configuration
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Report Name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={format}
                      label="Format"
                      onChange={(e) => setFormat(e.target.value as any)}
                    >
                      <MenuItem value="pdf">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PdfIcon sx={{ mr: 1 }} />
                          PDF Document
                        </Box>
                      </MenuItem>
                      <MenuItem value="excel">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ExcelIcon sx={{ mr: 1 }} />
                          Excel Spreadsheet
                        </Box>
                      </MenuItem>
                      <MenuItem value="csv">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TableChart sx={{ mr: 1 }} />
                          CSV File
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time Period</InputLabel>
                    <Select
                      value={filters.period || '30d'}
                      label="Time Period"
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        period: e.target.value as any
                      }))}
                    >
                      <MenuItem value="7d">Last 7 days</MenuItem>
                      <MenuItem value="30d">Last 30 days</MenuItem>
                      <MenuItem value="90d">Last 90 days</MenuItem>
                      <MenuItem value="1y">Last year</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Property ID (optional)"
                    value={filters.propertyId || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      propertyId: e.target.value || undefined
                    }))}
                    placeholder="Filter by property"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <ButtonGroup variant="outlined">
                  <Button
                    onClick={handleGenerateReport}
                    disabled={!selectedTemplate || !reportName.trim() || generating}
                    startIcon={generating ? undefined : getFormatIcon(format)}
                  >
                    {generating ? 'Generating...' : 'Generate Report'}
                  </Button>
                  <Button
                    onClick={handleScheduleReport}
                    disabled={!selectedTemplate}
                    startIcon={<ScheduleIcon />}
                  >
                    Schedule
                  </Button>
                </ButtonGroup>

                <Typography variant="caption" color="text.secondary">
                  Reports will be available for download once generated
                </Typography>
              </Box>

              {generating && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Generating report... This may take a few moments.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Schedule Dialog */}
        <Dialog
          open={showScheduleDialog}
          onClose={() => !scheduling && setShowScheduleDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Schedule Report: {reportName || 'Untitled'}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure automatic report generation and email delivery
            </Typography>

            <Grid container spacing={3}>
              {/* Frequency Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={scheduleFrequency}
                    label="Frequency"
                    onChange={(e) => setScheduleFrequency(e.target.value as any)}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Time Selection */}
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Time"
                  value={scheduleTime}
                  onChange={(newValue) => newValue && setScheduleTime(newValue)}
                  views={['hours', 'minutes']}
                  format="HH:mm"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'Report generation time'
                    }
                  }}
                />
              </Grid>

              {/* Day of Week for Weekly */}
              {scheduleFrequency === 'weekly' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Day of Week</InputLabel>
                    <Select
                      value={scheduleDayOfWeek}
                      label="Day of Week"
                      onChange={(e) => setScheduleDayOfWeek(Number(e.target.value))}
                    >
                      <MenuItem value={1}>Monday</MenuItem>
                      <MenuItem value={2}>Tuesday</MenuItem>
                      <MenuItem value={3}>Wednesday</MenuItem>
                      <MenuItem value={4}>Thursday</MenuItem>
                      <MenuItem value={5}>Friday</MenuItem>
                      <MenuItem value={6}>Saturday</MenuItem>
                      <MenuItem value={0}>Sunday</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Day of Month for Monthly/Quarterly */}
              {(scheduleFrequency === 'monthly' || scheduleFrequency === 'quarterly') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Day of Month"
                    value={scheduleDayOfMonth}
                    onChange={(e) => setScheduleDayOfMonth(Math.max(1, Math.min(31, Number(e.target.value))))}
                    inputProps={{ min: 1, max: 31 }}
                    helperText="1-31"
                  />
                </Grid>
              )}

              {/* Recipients */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Recipient Email Addresses"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  helperText="Separate multiple emails with commas"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              {/* Summary */}
              <Grid item xs={12}>
                <Alert severity="info" icon={<ScheduleIcon />}>
                  <Typography variant="body2">
                    <strong>Schedule Summary:</strong><br />
                    This report will be generated <strong>{scheduleFrequency}</strong>
                    {scheduleFrequency === 'weekly' && ` on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][scheduleDayOfWeek]}`}
                    {(scheduleFrequency === 'monthly' || scheduleFrequency === 'quarterly') && ` on day ${scheduleDayOfMonth}`}
                    {' '}at <strong>{scheduleTime.getHours().toString().padStart(2, '0')}:{scheduleTime.getMinutes().toString().padStart(2, '0')}</strong>
                    {' '}and emailed to the specified recipients.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>

            {scheduling && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowScheduleDialog(false)}
              disabled={scheduling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSchedule}
              variant="contained"
              disabled={scheduling || !recipients.trim()}
              startIcon={<ScheduleIcon />}
            >
              {scheduling ? 'Scheduling...' : 'Schedule Report'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportGenerator;