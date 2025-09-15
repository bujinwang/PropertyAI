import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  LinearProgress,
  Typography,
  Alert,
  Switch,
  FormControlLabel,
  TextField,
  Grid
} from '@mui/material';
import { Download, Schedule } from '@mui/icons-material';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  currentFilters: {
    dateFrom: string;
    dateTo: string;
    propertyIds: string;
  };
}

const ExportModal: React.FC<ExportModalProps> = ({ open, onClose, currentFilters }) => {
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [template, setTemplate] = useState<'tax' | 'audit'>('tax');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [scheduleEmail, setScheduleEmail] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setExportProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          format,
          template,
          filters: {
            dateFrom: currentFilters.dateFrom,
            dateTo: currentFilters.dateTo,
            propertyIds: currentFilters.propertyIds
          }
        })
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Export failed');
      }

      const result = await response.json();

      if (result.signedUrl) {
        // Large file - redirect to signed URL
        window.open(result.signedUrl, '_blank');
      } else {
        // Small file - download directly
        const link = document.createElement('a');
        link.href = `data:application/${format};base64,${result.data}`;
        link.download = `analytics-export-${template}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Close modal after successful export
      setTimeout(() => {
        onClose();
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleScheduleExport = async () => {
    if (!scheduleEmail) {
      setError('Email is required for scheduled exports');
      return;
    }

    try {
      const response = await fetch('/api/analytics/schedule-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          format,
          template,
          frequency: scheduleFrequency,
          email: scheduleEmail,
          filters: {
            dateFrom: currentFilters.dateFrom,
            dateTo: currentFilters.dateTo,
            propertyIds: currentFilters.propertyIds
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Scheduling failed');
      }

      setError(null);
      alert(`Export scheduled successfully! You will receive ${scheduleFrequency} reports at ${scheduleEmail}`);
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scheduling failed');
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
      setError(null);
      setExportProgress(0);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Download />
          Export Analytics Report
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                value={format}
                label="Format"
                onChange={(e) => setFormat(e.target.value as 'pdf' | 'csv')}
                disabled={isExporting}
              >
                <MenuItem value="pdf">PDF Report</MenuItem>
                <MenuItem value="csv">CSV Data</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select
                value={template}
                label="Template"
                onChange={(e) => setTemplate(e.target.value as 'tax' | 'audit')}
                disabled={isExporting}
              >
                <MenuItem value="tax">Tax Summary</MenuItem>
                <MenuItem value="audit">Audit Trail</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Current Filters Applied:
          </Typography>
          <Typography variant="body2">
            • Date Range: {currentFilters.dateFrom} to {currentFilters.dateTo}
          </Typography>
          {currentFilters.propertyIds && (
            <Typography variant="body2">
              • Properties: {currentFilters.propertyIds}
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={enableScheduling}
                onChange={(e) => setEnableScheduling(e.target.checked)}
                disabled={isExporting}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Schedule fontSize="small" />
                Schedule Recurring Export
              </Box>
            }
          />
        </Box>

        {enableScheduling && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={scheduleFrequency}
                  label="Frequency"
                  onChange={(e) => setScheduleFrequency(e.target.value as 'weekly' | 'monthly')}
                  disabled={isExporting}
                >
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={scheduleEmail}
                onChange={(e) => setScheduleEmail(e.target.value)}
                disabled={isExporting}
                placeholder="your@email.com"
              />
            </Grid>
          </Grid>
        )}

        {isExporting && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Generating export... {exportProgress}%
            </Typography>
            <LinearProgress variant="determinate" value={exportProgress} />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isExporting}>
          Cancel
        </Button>
        {enableScheduling ? (
          <Button
            onClick={handleScheduleExport}
            variant="contained"
            disabled={isExporting || !scheduleEmail}
            startIcon={<Schedule />}
          >
            Schedule Export
          </Button>
        ) : (
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={isExporting}
            startIcon={<Download />}
          >
            {isExporting ? 'Exporting...' : 'Export Now'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ExportModal;