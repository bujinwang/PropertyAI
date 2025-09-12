import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Snackbar,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, Document, DocumentFilters } from '../services/dashboardService';

import DocumentUpload from '../components/DocumentUpload';

const DocumentList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const limit = 10;
  const queryClient = useQueryClient();

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  const [openUpload, setOpenUpload] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Partial<Document>>({});

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const filters: DocumentFilters = {
    search: searchTerm || undefined,
    type: typeFilter || undefined,
    entityId: entityFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['documents', page, searchTerm, typeFilter, entityFilter, dateFrom, dateTo],
    queryFn: () => dashboardService.getDocuments(page, limit, filters),
    select: (response) => ({
      documents: response.data,
      total: response.total,
    }),
  });

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dashboardService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSnackbar({ open: true, message: 'Document deleted successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete document', severity: 'error' });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => dashboardService.downloadDocument(id),
    onSuccess: (blob, id) => {
      const doc = data?.documents.find(d => d.id === id);
      const url = URL.createObjectURL(blob);
      const link = (globalThis as any).document.createElement('a');
      link.href = url;
      link.download = doc?.name || 'document';
      (globalThis as any).document.body.appendChild(link);
      link.click();
      (globalThis as any).document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Document downloaded successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to download document', severity: 'error' });
    },
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleTypeFilterChange = (event: any) => {
    setTypeFilter(event.target.value as string);
    setPage(1);
  };

  const handleEntityFilterChange = (event: any) => {
    setEntityFilter(event.target.value as string);
    setPage(1);
  };

  const handleDateFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateFrom(event.target.value);
    setPage(1);
  };

  const handleDateToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateTo(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleOpenUpload = (isEdit: boolean = false, document: Partial<Document> = {}) => {
    setEditMode(isEdit);
    setSelectedDocument(document);
    setOpenUpload(true);
  };

  const handleCloseUpload = () => {
    setOpenUpload(false);
    setSelectedDocument({});
  };

  const handleOpenDelete = (id: string) => {
    setSelectedDeleteId(id);
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setSelectedDeleteId(null);
  };

  const handleDelete = () => {
    if (selectedDeleteId) {
      deleteMutation.mutate(selectedDeleteId);
      handleCloseDelete();
    }
  };

  const handleDownload = (id: string) => {
    downloadMutation.mutate(id);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return 'error';
    if (type.includes('doc')) return 'primary';
    if (type.includes('xls')) return 'success';
    if (type.includes('jpg') || type.includes('png') || type.includes('jpeg')) return 'warning';
    return 'default';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to fetch documents</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Document Management
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'end', flexWrap: 'wrap' }}>
          <TextField
            label="Search Documents"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name, description, or tags..."
            sx={{ minWidth: 300 }}
          />

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>File Type</InputLabel>
            <Select
              value={typeFilter}
              label="File Type"
              onChange={handleTypeFilterChange}
            >
              <MenuItem value="">
                <em>All Types</em>
              </MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="doc">Word Documents</MenuItem>
              <MenuItem value="xls">Excel Files</MenuItem>
              <MenuItem value="jpg">Images</MenuItem>
              <MenuItem value="png">Images</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Entity Type</InputLabel>
            <Select
              value={entityFilter}
              label="Entity Type"
              onChange={handleEntityFilterChange}
            >
              <MenuItem value="">
                <em>All Entities</em>
              </MenuItem>
              <MenuItem value="property">Properties</MenuItem>
              <MenuItem value="tenant">Tenants</MenuItem>
              <MenuItem value="lease">Leases</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Date From"
            type="date"
            value={dateFrom}
            onChange={handleDateFromChange}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Date To"
            type="date"
            value={dateTo}
            onChange={handleDateToChange}
            InputLabelProps={{ shrink: true }}
          />

          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenUpload(false)}>
            Upload Document
          </Button>
        </Box>
      </Box>

      <DocumentUpload
        open={openUpload}
        onClose={handleCloseUpload}
        onSubmitSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['documents'] });
          setSnackbar({ open: true, message: 'Document uploaded successfully', severity: 'success' });
        }}
        initialValues={selectedDocument}
        isEdit={editMode}
        documentId={editMode ? selectedDocument.id : undefined}
      />

      <TableContainer component={Paper} sx={{ minHeight: 400 }}>
        <Table aria-label="Documents table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.documents.map((document: Document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {document.name}
                    </Typography>
                    {document.description && (
                      <Typography variant="caption" color="text.secondary">
                        {document.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={document.fileType.toUpperCase()}
                    color={getFileTypeColor(document.fileType) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                <TableCell>
                  {document.propertyName && <Typography variant="body2">Property: {document.propertyName}</Typography>}
                  {document.tenantName && <Typography variant="body2">Tenant: {document.tenantName}</Typography>}
                  {document.leaseDetails && <Typography variant="body2">Lease: {document.leaseDetails}</Typography>}
                  {document.maintenanceTitle && <Typography variant="body2">Maintenance: {document.maintenanceTitle}</Typography>}
                  {!document.propertyName && !document.tenantName && !document.leaseDetails && !document.maintenanceTitle && (
                    <Typography variant="body2" color="text.secondary">General</Typography>
                  )}
                </TableCell>
                <TableCell>{document.uploadedByName || 'Unknown'}</TableCell>
                <TableCell>{new Date(document.uploadedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {document.tags.slice(0, 2).map((tag, index) => (
                      <Chip key={index} label={tag} size="small" variant="outlined" />
                    ))}
                    {document.tags.length > 2 && (
                      <Chip label={`+${document.tags.length - 2}`} size="small" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title="Download">
                    <IconButton onClick={() => handleDownload(document.id)} aria-label="Download document">
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleOpenUpload(true, document)} aria-label="Edit document">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleOpenDelete(document.id)} aria-label="Delete document">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
          aria-label="Documents pagination"
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this document? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>Cancel</Button>
          <Button onClick={handleDelete} color="error" disabled={deleteMutation.isPending}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentList;