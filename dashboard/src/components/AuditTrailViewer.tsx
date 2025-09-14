/**
 * Audit Trail Viewer Component
 * Displays comprehensive audit logs for reports with filtering and search capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Pagination,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import reportingService from '../services/reportingService';

interface AuditEntry {
  id: string;
  action: string;
  resourceType: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AuditTrailViewerProps {
  reportId: string;
  onClose?: () => void;
}

const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ reportId, onClose }) => {
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  useEffect(() => {
    loadAuditTrail();
  }, [page, actionFilter, startDate, endDate]);

  const loadAuditTrail = async () => {
    try {
      setLoading(true);
      const options = {
        actions: actionFilter ? [actionFilter] : [],
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize
      };

      const result = await reportingService.getReportAuditTrail(reportId, options);
      setAuditLogs(result.logs);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setDetailsDialog(true);
  };

  const handleExportAudit = async () => {
    try {
      // Export all audit logs for this report
      const result = await reportingService.getReportAuditTrail(reportId, {
        limit: 1000, // Export up to 1000 entries
        offset: 0
      });

      const csvContent = generateCSV(result.logs);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-trail-${reportId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting audit trail:', error);
    }
  };

  const generateCSV = (logs: AuditEntry[]): string => {
    const headers = ['Timestamp', 'Action', 'User', 'Resource Type', 'IP Address', 'Details'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.action,
      `${log.user.firstName} ${log.user.lastName} (${log.user.email})`,
      log.resourceType,
      log.ipAddress || 'N/A',
      JSON.stringify(log.details)
    ]);

    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'success';
      case 'viewed': return 'info';
      case 'exported': return 'warning';
      case 'emailed': return 'primary';
      case 'modified': return 'secondary';
      case 'deleted': return 'error';
      case 'compliance_check': return 'warning';
      default: return 'default';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'viewed': return <VisibilityIcon />;
      case 'exported': return <DownloadIcon />;
      case 'compliance_check': return <SecurityIcon />;
      default: return null;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.user.firstName.toLowerCase().includes(searchLower) ||
      log.user.lastName.toLowerCase().includes(searchLower) ||
      log.user.email.toLowerCase().includes(searchLower) ||
      log.resourceType.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Audit Trail - Report {reportId}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportAudit}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadAuditTrail}
              disabled={loading}
            >
              Refresh
            </Button>
            {onClose && (
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
            )}
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Search"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ minWidth: 200 }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={actionFilter}
                  label="Action"
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="created">Created</MenuItem>
                  <MenuItem value="viewed">Viewed</MenuItem>
                  <MenuItem value="exported">Exported</MenuItem>
                  <MenuItem value="emailed">Emailed</MenuItem>
                  <MenuItem value="modified">Modified</MenuItem>
                  <MenuItem value="deleted">Deleted</MenuItem>
                  <MenuItem value="compliance_check">Compliance Check</MenuItem>
                </Select>
              </FormControl>

              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />

              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />

              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => {
                  setActionFilter('');
                  setStartDate(null);
                  setEndDate(null);
                  setSearchTerm('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredLogs.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No audit entries found matching the current filters.
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Resource Type</TableCell>
                        <TableCell>IP Address</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredLogs.map((entry) => (
                        <TableRow key={entry.id} hover>
                          <TableCell>
                            {new Date(entry.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getActionIcon(entry.action) || undefined}
                              label={entry.action.replace('_', ' ')}
                              color={getActionColor(entry.action) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {entry.user.firstName} {entry.user.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {entry.user.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{entry.resourceType}</TableCell>
                          <TableCell>{entry.ipAddress || 'N/A'}</TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(entry)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(event, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog
          open={detailsDialog}
          onClose={() => setDetailsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Audit Entry Details</DialogTitle>
          <DialogContent>
            {selectedEntry && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedEntry.action.replace('_', ' ').toUpperCase()}
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Timestamp: {new Date(selectedEntry.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    User: {selectedEntry.user.firstName} {selectedEntry.user.lastName} ({selectedEntry.user.email})
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Resource Type: {selectedEntry.resourceType}
                  </Typography>
                  {selectedEntry.ipAddress && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      IP Address: {selectedEntry.ipAddress}
                    </Typography>
                  )}
                  {selectedEntry.userAgent && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      User Agent: {selectedEntry.userAgent}
                    </Typography>
                  )}
                </Box>

                <Typography variant="h6" gutterBottom>
                  Details
                </Typography>
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify(selectedEntry.details, null, 2)}
                  </pre>
                </Paper>
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

export default AuditTrailViewer;