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
  Snackbar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, Lease } from '../services/dashboardService';

import LeaseForm from '../components/LeaseForm';
import AssociationModal from '../components/AssociationModal';

const LeaseList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 10;
  const queryClient = useQueryClient();

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  const [openForm, setOpenForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Partial<Lease>>({});

  const [openAssociationModal, setOpenAssociationModal] = useState(false);
  const [associationMode, setAssociationMode] = useState<'associate' | 'renew'>('associate');
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['leases', page, searchTerm],
    queryFn: () => dashboardService.getLeases(page, limit, searchTerm),
    select: (response) => ({
      leases: response.data,
      total: response.total,
    }),
  });

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dashboardService.deleteLease(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      setSnackbar({ open: true, message: 'Lease deleted successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete lease', severity: 'error' });
    },
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleOpenForm = (isEdit: boolean = false, lease: Partial<Lease> = {}) => {
    setEditMode(isEdit);
    setSelectedLease(lease);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedLease({});
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

  const handleOpenAssociationModal = (leaseId: string, mode: 'associate' | 'renew') => {
    setSelectedLeaseId(leaseId);
    setAssociationMode(mode);
    setOpenAssociationModal(true);
  };

  const handleCloseAssociationModal = () => {
    setOpenAssociationModal(false);
    setSelectedLeaseId('');
  };

  const handleAssociationSubmit = (data: any) => {
    queryClient.invalidateQueries({ queryKey: ['leases'] });
    const message = data.mode === 'associate'
      ? 'Lease associated successfully'
      : 'Lease renewed successfully';
    setSnackbar({ open: true, message, severity: 'success' });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to fetch leases</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Leases
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'end', flexWrap: 'wrap' }}>
          <TextField
            label="Search Leases"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by tenant name or unit address..."
            sx={{ minWidth: 300 }}
          />
          <Button variant="contained" onClick={() => handleOpenForm(false)}>
            Add Lease
          </Button>
        </Box>
      </Box>

      <LeaseForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmitSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['leases'] });
          setSnackbar({ open: true, message: 'Lease saved successfully', severity: 'success' });
        }}
        initialValues={selectedLease}
        isEdit={editMode}
        leaseId={editMode ? selectedLease.id : undefined}
      />

      <TableContainer component={Paper} sx={{ minHeight: 400 }}>
        <Table aria-label="Leases table">
          <TableHead>
            <TableRow>
              <TableCell>Tenant Name</TableCell>
              <TableCell>Unit Address</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Rent Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.leases.map((lease: Lease) => (
              <TableRow key={lease.id}>
                <TableCell>{lease.tenantName || 'N/A'}</TableCell>
                <TableCell>{lease.unitAddress || 'N/A'}</TableCell>
                <TableCell>{new Date(lease.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(lease.endDate).toLocaleDateString()}</TableCell>
                <TableCell>${lease.rentAmount.toLocaleString()}</TableCell>
                <TableCell>{lease.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenForm(true, lease)} aria-label="Edit lease">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleOpenAssociationModal(lease.id, 'associate')} aria-label="Associate lease">
                    <PersonAddIcon />
                  </IconButton>
                  <IconButton onClick={() => handleOpenAssociationModal(lease.id, 'renew')} aria-label="Renew lease">
                    <AutorenewIcon />
                  </IconButton>
                  <IconButton onClick={() => handleOpenDelete(lease.id)} aria-label="Delete lease">
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
          aria-label="Lease list pagination"
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this lease? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>Cancel</Button>
          <Button onClick={handleDelete} color="error" disabled={deleteMutation.isPending}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Association Modal */}
      <AssociationModal
        open={openAssociationModal}
        onClose={handleCloseAssociationModal}
        leaseId={selectedLeaseId}
        mode={associationMode}
        onSubmit={handleAssociationSubmit}
      />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaseList;