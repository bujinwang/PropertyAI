import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  Storage as StorageIcon,
  DeleteSweep as CleanupIcon,
  Assessment as StatsIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { reportingService } from '../services/reportingService';

interface RetentionStats {
  auditLogs: {
    total: number;
    expired: number;
  };
  reportVersions: {
    total: number;
  };
  complianceChecks: {
    total: number;
  };
  generatedReports: {
    total: number;
  };
  scheduledReports: {
    total: number;
    inactive: number;
  };
}

interface CleanupResults {
  auditLogs: number;
  reportVersions: number;
  complianceChecks: number;
  generatedReports: number;
  scheduledReports: number;
}

const DataRetentionDashboard: React.FC = () => {
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<CleanupResults | null>(null);
  const [runningCleanup, setRunningCleanup] = useState(false);

  useEffect(() => {
    loadRetentionStats();
  }, []);

  const loadRetentionStats = async () => {
    setLoading(true);
    try {
      const retentionStats = await reportingService.getDataRetentionStats();
      setStats(retentionStats);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load retention statistics');
    } finally {
      setLoading(false);
    }
  };

  const runDataCleanup = async () => {
    setRunningCleanup(true);
    try {
      const results = await reportingService.triggerDataCleanup();
      setCleanupResults(results);
      setShowCleanupDialog(false);
      // Reload stats after cleanup
      await loadRetentionStats();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to run data cleanup');
    } finally {
      setRunningCleanup(false);
    }
  };

  const getTotalExpiredRecords = () => {
    if (!stats) return 0;
    return stats.auditLogs.expired;
  };

  const getTotalRecords = () => {
    if (!stats) return 0;
    return (
      stats.auditLogs.total +
      stats.reportVersions.total +
      stats.complianceChecks.total +
      stats.generatedReports.total +
      stats.scheduledReports.total
    );
  };

  const getCleanupProgress = () => {
    if (!cleanupResults) return 0;
    const totalCleaned = Object.values(cleanupResults).reduce((sum, count) => sum + count, 0);
    const totalExpired = getTotalExpiredRecords();
    return totalExpired > 0 ? (totalCleaned / totalExpired) * 100 : 0;
  };

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Data Retention Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<StatsIcon />}
            onClick={loadRetentionStats}
            sx={{ mr: 1 }}
          >
            Refresh Stats
          </Button>
          <Button
            variant="contained"
            startIcon={<CleanupIcon />}
            onClick={() => setShowCleanupDialog(true)}
            color="warning"
          >
            Run Cleanup
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {cleanupResults && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Data cleanup completed successfully!
          </Typography>
          <Typography variant="caption">
            Cleaned up {Object.values(cleanupResults).reduce((sum, count) => sum + count, 0)} records
          </Typography>
        </Alert>
      )}

      {stats && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <StorageIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Total Records</Typography>
                  </Box>
                  <Typography variant="h4">{getTotalRecords().toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Expired Records</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {getTotalExpiredRecords().toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SuccessIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Active Reports</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {stats.generatedReports.total.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ErrorIcon color="error" sx={{ mr: 1 }} />
                    <Typography variant="h6">Inactive Schedules</Typography>
                  </Box>
                  <Typography variant="h4" color="error.main">
                    {stats.scheduledReports.inactive.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Statistics Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Retention Details
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data Type</TableCell>
                      <TableCell align="right">Total Records</TableCell>
                      <TableCell align="right">Expired</TableCell>
                      <TableCell align="right">Active</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Audit Logs</TableCell>
                      <TableCell align="right">{stats.auditLogs.total.toLocaleString()}</TableCell>
                      <TableCell align="right">{stats.auditLogs.expired.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        {(stats.auditLogs.total - stats.auditLogs.expired).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stats.auditLogs.expired > 0 ? 'Cleanup Needed' : 'Clean'}
                          color={stats.auditLogs.expired > 0 ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Report Versions</TableCell>
                      <TableCell align="right">{stats.reportVersions.total.toLocaleString()}</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right">{stats.reportVersions.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label="Managed"
                          color="info"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Compliance Checks</TableCell>
                      <TableCell align="right">{stats.complianceChecks.total.toLocaleString()}</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right">{stats.complianceChecks.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label="Active"
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Generated Reports</TableCell>
                      <TableCell align="right">{stats.generatedReports.total.toLocaleString()}</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right">{stats.generatedReports.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label="Current"
                          color="success"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Scheduled Reports</TableCell>
                      <TableCell align="right">{stats.scheduledReports.total.toLocaleString()}</TableCell>
                      <TableCell align="right">{stats.scheduledReports.inactive.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        {(stats.scheduledReports.total - stats.scheduledReports.inactive).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stats.scheduledReports.inactive > 0 ? 'Review Needed' : 'Active'}
                          color={stats.scheduledReports.inactive > 0 ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Cleanup Confirmation Dialog */}
      <Dialog open={showCleanupDialog} onClose={() => setShowCleanupDialog(false)}>
        <DialogTitle>Data Retention Cleanup</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This will permanently delete expired audit logs and old data according to retention policies.
          </Typography>

          {stats && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Records to be cleaned up: {getTotalExpiredRecords().toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total records: {getTotalRecords().toLocaleString()}
              </Typography>
            </Box>
          )}

          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. Make sure you have backups if needed.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCleanupDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={runDataCleanup}
            variant="contained"
            color="warning"
            disabled={runningCleanup}
          >
            {runningCleanup ? 'Running Cleanup...' : 'Run Cleanup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cleanup Progress Dialog */}
      <Dialog open={runningCleanup} maxWidth="sm" fullWidth>
        <DialogTitle>Running Data Cleanup</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Cleaning up expired data...
            </Typography>
            <LinearProgress variant="indeterminate" />
          </Box>
          <Typography variant="caption" color="text.secondary">
            This may take a few minutes depending on the amount of data.
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DataRetentionDashboard;