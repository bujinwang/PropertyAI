import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  Email as EmailIcon,
  History as HistoryIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { reportingService, GeneratedReport, ReportVersion } from '../services/reportingService';
import AuditTrailViewer from './AuditTrailViewer';

interface ReportViewerProps {
  reportId: string;
  onClose?: () => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ reportId, onClose }) => {
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [versions, setVersions] = useState<ReportVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReport();
    loadVersions();
  }, [reportId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const reportData = await reportingService.getReport(reportId);
      setReport(reportData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      const response = await reportingService.getReportVersions(reportId);
      setVersions(response.versions);
    } catch (err: any) {
      console.error('Failed to load versions:', err);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'excel' = 'pdf') => {
    setExporting(true);
    try {
      const { fileName, downloadUrl } = await reportingService.exportReport(reportId, format);

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.click();
    } catch (err: any) {
      setError(err.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const formatContent = (content: any) => {
    if (!content) return 'No content available';

    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'success';
      case 'sent': return 'info';
      case 'archived': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !report) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'Report not found'}
        </Alert>
        {onClose && (
          <Button onClick={onClose} sx={{ mt: 2 }}>
            Close
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Report Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Report Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {report.id}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('pdf')}
                disabled={exporting}
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('csv')}
                disabled={exporting}
              >
                CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('excel')}
                disabled={exporting}
              >
                Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                disabled={exporting}
              >
                Email
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={report.status}
                color={getStatusColor(report.status)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                AI Confidence
              </Typography>
              <Typography variant="body1">
                {report.aiConfidence}%
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Generated
              </Typography>
              <Typography variant="body1">
                {new Date(report.generatedAt).toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Period
              </Typography>
              <Typography variant="body1">
                {report.periodStart} to {report.periodEnd}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Report Content Tabs */}
      <Card>
        <CardContent>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Content" />
            <Tab label="Insights" />
            <Tab label="Versions" />
            <Tab label="Audit" />
          </Tabs>

          {/* Content Tab */}
          {selectedTab === 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Report Content
              </Typography>
              <Box component="pre" sx={{
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 1,
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                {formatContent(report.content)}
              </Box>
            </Box>
          )}

          {/* Insights Tab */}
          {selectedTab === 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                AI Insights
              </Typography>
              {report.content?.insights ? (
                <Box>
                  {report.content.insights.map((insight: any, index: number) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Chip
                            label={insight.type}
                            size="small"
                            color="primary"
                          />
                          <Chip
                            label={`${insight.confidence}% confidence`}
                            size="small"
                            color={insight.confidence > 80 ? 'success' : 'warning'}
                          />
                        </Box>
                        <Typography variant="body1">
                          {insight.text}
                        </Typography>
                        {insight.source && (
                          <Typography variant="caption" color="text.secondary">
                            Source: {insight.source}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No insights available for this report.
                </Typography>
              )}
            </Box>
          )}

          {/* Versions Tab */}
          {selectedTab === 2 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Report Versions
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Version</TableCell>
                      <TableCell>Change Type</TableCell>
                      <TableCell>Compliance Status</TableCell>
                      <TableCell>AI Confidence</TableCell>
                      <TableCell>Created By</TableCell>
                      <TableCell>Created At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {versions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell>{version.version}</TableCell>
                        <TableCell>
                          <Chip
                            label={version.changeType}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={version.complianceStatus}
                            size="small"
                            color={
                              version.complianceStatus === 'passed' ? 'success' :
                              version.complianceStatus === 'failed' ? 'error' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {version.aiConfidence ? `${version.aiConfidence}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {version.creator.firstName} {version.creator.lastName}
                        </TableCell>
                        <TableCell>
                          {new Date(version.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Audit Tab */}
          {selectedTab === 3 && (
            <Box sx={{ mt: 2 }}>
              <AuditTrailViewer
                reportId={reportId}
                title="Report Audit Trail"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {onClose && (
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Button onClick={onClose}>
            Close
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ReportViewer;