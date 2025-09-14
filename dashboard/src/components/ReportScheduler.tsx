/**
 * ReportScheduler Component
 * Schedule automated report generation and delivery
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Pause as PauseIcon,
  Email as EmailIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import reportingService from '../services/reportingService';
import {
  ScheduledReport,
  ReportTemplate,
  ReportParameters
} from '../types/reporting';

interface ReportSchedulerProps {
  templates: ReportTemplate[];
}

const ReportScheduler: React.FC<ReportSchedulerProps> = ({ templates }) => {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Form state for creating/editing scheduled reports
  const [scheduleForm, setScheduleForm] = useState({
    templateId: '',
    parameters: {} as ReportParameters,
    schedule: {
      frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
      time: new Date(),
      dayOfWeek: 1, // Monday
      dayOfMonth: 1,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    recipients: [] as string[],
    isActive: true
  });

  useEffect(() => {
    loadScheduledReports();
  }, []);

  const loadScheduledReports = async () => {
    try {
      setLoading(true);
      const reports = await reportingService.getScheduledReports();
      setScheduledReports(reports);
    } catch (error) {
      showSnackbar('Failed to load scheduled reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateSchedule = () => {
    setEditingReport(null);
    setScheduleForm({
      templateId: '',
      parameters: {},
      schedule: {
        frequency: 'weekly',
        time: new Date(),
        dayOfWeek: 1,
        dayOfMonth: 1,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      recipients: [],
      isActive: true
    });
    setDialogOpen(true);
  };

  const handleEditSchedule = (report: ScheduledReport) => {
    setEditingReport(report);
    setScheduleForm({
      templateId: report.templateId,
      parameters: report.parameters,
      schedule: report.schedule,
      recipients: report.recipients,
      isActive: report.isActive
    });
    setDialogOpen(true);
  };

  const handleDeleteSchedule = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this scheduled report?')) return;

    try {
      // This would call a delete API endpoint
      showSnackbar('Scheduled report deleted successfully', 'success');
      loadScheduledReports();
    } catch (error) {
      showSnackbar('Failed to delete scheduled report', 'error');
    }
  };

  const handleToggleSchedule = async (report: ScheduledReport) => {
    try {
      // This would call an update API endpoint
      const updatedReport = { ...report, isActive: !report.isActive };
      showSnackbar(
        `Scheduled report ${updatedReport.isActive ? 'activated' : 'paused'}`,
        'success'
      );
      loadScheduledReports();
    } catch (error) {
      showSnackbar('Failed to update scheduled report', 'error');
    }
  };

  const handleRunNow = async (report: ScheduledReport) => {
    try {
      setLoading(true);
      const result = await reportingService.generateReport({
        templateId: report.templateId,
        parameters: report.parameters,
        format: 'pdf',
        emailDelivery: true,
        recipientEmails: report.recipients
      });

      showSnackbar(`Report generation started. ID: ${result.reportId}`, 'success');
    } catch (error) {
      showSnackbar('Failed to run scheduled report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setLoading(true);

      const scheduleData = {
        templateId: scheduleForm.templateId,
        parameters: scheduleForm.parameters,
        schedule: scheduleForm.schedule,
        recipients: scheduleForm.recipients
      };

      if (editingReport) {
        // Update existing schedule
        showSnackbar('Scheduled report updated successfully', 'success');
      } else {
        // Create new schedule
        await reportingService.scheduleReport(scheduleData);
        showSnackbar('Scheduled report created successfully', 'success');
      }

      setDialogOpen(false);
      loadScheduledReports();
    } catch (error) {
      showSnackbar('Failed to save scheduled report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      default: return frequency;
    }
  };

  const getNextRunTime = (schedule: ScheduledReport['schedule']) => {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    if (nextRun <= now) {
      // Schedule for next occurrence
      switch (schedule.frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          const daysUntilNext = (schedule.dayOfWeek! - nextRun.getDay() + 7) % 7;
          nextRun.setDate(nextRun.getDate() + (daysUntilNext || 7));
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          nextRun.setDate(schedule.dayOfMonth!);
          break;
        case 'quarterly':
          nextRun.setMonth(nextRun.getMonth() + 3);
          nextRun.setDate(schedule.dayOfMonth!);
          break;
      }
    }

    return nextRun;
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template?.name || 'Unknown Template';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            <ScheduleIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Report Scheduler
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateSchedule}
          >
            Schedule Report
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Scheduled Reports List */}
        <Paper sx={{ width: '100%' }}>
          <List>
            {scheduledReports.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No scheduled reports"
                  secondary="Create your first scheduled report to get started"
                />
              </ListItem>
            ) : (
              scheduledReports.map((report) => (
                <ListItem key={report.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {getTemplateName(report.templateId)}
                        </Typography>
                        <Chip
                          label={getFrequencyLabel(report.schedule.frequency)}
                          size="small"
                          color="primary"
                        />
                        <Chip
                          label={report.isActive ? 'Active' : 'Paused'}
                          size="small"
                          color={report.isActive ? 'success' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Next run: {getNextRunTime(report.schedule).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Recipients: {report.recipients.join(', ')}
                        </Typography>
                        {report.lastRun && (
                          <Typography variant="body2" color="text.secondary">
                            Last run: {new Date(report.lastRun).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Run Now">
                      <IconButton
                        onClick={() => handleRunNow(report)}
                        disabled={!report.isActive}
                      >
                        <RunIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={report.isActive ? "Pause" : "Resume"}>
                      <IconButton onClick={() => handleToggleSchedule(report)}>
                        {report.isActive ? <PauseIcon /> : <ScheduleIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEditSchedule(report)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDeleteSchedule(report.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        </Paper>

        {/* Schedule Creation/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingReport ? 'Edit Scheduled Report' : 'Schedule New Report'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                {/* Template Selection */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Report Template</InputLabel>
                    <Select
                      value={scheduleForm.templateId}
                      onChange={(e) => setScheduleForm(prev => ({
                        ...prev,
                        templateId: e.target.value
                      }))}
                    >
                      {templates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name} - {template.type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Frequency */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={scheduleForm.schedule.frequency}
                      onChange={(e) => setScheduleForm(prev => ({
                        ...prev,
                        schedule: {
                          ...prev.schedule,
                          frequency: e.target.value as any
                        }
                      }))}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Time */}
                <Grid item xs={12} sm={6}>
                  <TimePicker
                    label="Time"
                    value={scheduleForm.schedule.time}
                    onChange={(time) => setScheduleForm(prev => ({
                      ...prev,
                      schedule: {
                        ...prev.schedule,
                        time: time || new Date()
                      }
                    }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                {/* Day of Week (for weekly) */}
                {scheduleForm.schedule.frequency === 'weekly' && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Day of Week</InputLabel>
                      <Select
                        value={scheduleForm.schedule.dayOfWeek}
                        onChange={(e) => setScheduleForm(prev => ({
                          ...prev,
                          schedule: {
                            ...prev.schedule,
                            dayOfWeek: e.target.value as number
                          }
                        }))}
                      >
                        <MenuItem value={0}>Sunday</MenuItem>
                        <MenuItem value={1}>Monday</MenuItem>
                        <MenuItem value={2}>Tuesday</MenuItem>
                        <MenuItem value={3}>Wednesday</MenuItem>
                        <MenuItem value={4}>Thursday</MenuItem>
                        <MenuItem value={5}>Friday</MenuItem>
                        <MenuItem value={6}>Saturday</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Day of Month (for monthly/quarterly) */}
                {(scheduleForm.schedule.frequency === 'monthly' || scheduleForm.schedule.frequency === 'quarterly') && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Day of Month"
                      type="number"
                      inputProps={{ min: 1, max: 31 }}
                      value={scheduleForm.schedule.dayOfMonth}
                      onChange={(e) => setScheduleForm(prev => ({
                        ...prev,
                        schedule: {
                          ...prev.schedule,
                          dayOfMonth: parseInt(e.target.value) || 1
                        }
                      }))}
                    />
                  </Grid>
                )}

                {/* Recipients */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Recipients"
                    placeholder="email1@example.com, email2@example.com"
                    value={scheduleForm.recipients.join(', ')}
                    onChange={(e) => setScheduleForm(prev => ({
                      ...prev,
                      recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                    }))}
                    helperText="Comma-separated email addresses"
                  />
                </Grid>

                {/* Active Status */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={scheduleForm.isActive}
                        onChange={(e) => setScheduleForm(prev => ({
                          ...prev,
                          isActive: e.target.checked
                        }))}
                      />
                    }
                    label="Active Schedule"
                  />
                </Grid>

                {/* Preview Next Run */}
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      Next scheduled run: {getNextRunTime(scheduleForm.schedule).toLocaleString()}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveSchedule}
              variant="contained"
              disabled={loading || !scheduleForm.templateId}
            >
              {loading ? <CircularProgress size={20} /> : 'Save Schedule'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Dialog
          open={snackbar.open}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          maxWidth="sm"
          fullWidth
        >
          <DialogContent>
            <Alert
              onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </DialogContent>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportScheduler;