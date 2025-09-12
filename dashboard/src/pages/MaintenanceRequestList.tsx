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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, MaintenanceRequest } from '../services/dashboardService';

import MaintenanceRequestForm from '../components/MaintenanceRequestForm';

const MaintenanceRequestList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const limit = 10;
  const queryClient = useQueryClient();

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  const [openForm, setOpenForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Partial<MaintenanceRequest>>({});

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['maintenance-requests', page, searchTerm, statusFilter, priorityFilter],
    queryFn: () => dashboardService.getMaintenanceRequests(page, limit, searchTerm, statusFilter, priorityFilter),
    select: (response) => ({
      requests: response.data,
      total: response.total,
    }),
  });

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dashboardService.deleteMaintenanceRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      setSnackbar({ open: true, message: 'Maintenance request deleted successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete maintenance request', severity: 'error' });
    },
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value as string);
    setPage(1);
  };

  const handlePriorityFilterChange = (event: any) => {
    setPriorityFilter(event.target.value as string);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleOpenForm = (isEdit: boolean = false, request: Partial<MaintenanceRequest> = {}) => {
    setEditMode(isEdit);
    setSelectedRequest(request);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedRequest({});
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

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in progress': return 'info';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to fetch maintenance requests</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Maintenance Requests
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'end', flexWrap: 'wrap' }}>
          <TextField
            label="Search Requests"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by tenant name, unit address, or description..."
            sx={{ minWidth: 300 }}
          />

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="">
                <em>All Statuses</em>
              </MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={handlePriorityFilterChange}
            >
              <MenuItem value="">
                <em>All Priorities</em>
              </MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm(false)}>
            Add Request
          </Button>
        </Box>
      </Box>

      <MaintenanceRequestForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmitSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
          setSnackbar({ open: true, message: 'Maintenance request saved successfully', severity: 'success' });
        }}
        initialValues={selectedRequest}
        isEdit={editMode}
        requestId={editMode ? selectedRequest.id : undefined}
      />

      <TableContainer component={Paper} sx={{ minHeight: 400 }}>
        <Table aria-label="Maintenance requests table">
          <TableHead>
            <TableRow>
              <TableCell>Tenant Name</TableCell>
              <TableCell>Unit Address</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.requests.map((request: MaintenanceRequest) => (
              <TableRow key={request.id}>
                <TableCell>{request.tenantName || 'N/A'}</TableCell>
                <TableCell>{request.unitAddress || 'N/A'}</TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {request.description}
                </TableCell>
                <TableCell>
                  <Chip
                    label={request.priority}
                    color={getPriorityColor(request.priority) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={request.status}
                    color={getStatusColor(request.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(request.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenForm(true, request)} aria-label="Edit request">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleOpenDelete(request.id)} aria-label="Delete request">
                    <DeleteIcon />
                  </IconButton>
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
          aria-label="Maintenance requests pagination"
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this maintenance request? This action cannot be undone.
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

export default MaintenanceRequestList;