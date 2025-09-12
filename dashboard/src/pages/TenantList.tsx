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
  Checkbox,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, Tenant } from '../services/dashboardService';

import TenantForm from '../components/TenantForm';
import AssignmentModal from '../components/AssignmentModal';

const TenantList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 10;
  const queryClient = useQueryClient();

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  const [openForm, setOpenForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Partial<Tenant>>({});

  // For assignment
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [assignMode, setAssignMode] = useState<'assign' | 'bulk'>('assign');
  const [currentTenantId, setCurrentTenantId] = useState<string | undefined>();

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['tenants', page, searchTerm],
    queryFn: () => dashboardService.getTenants(page, limit, searchTerm),
    select: (response) => ({
      tenants: response.data,
      total: response.total,
    }),
  });

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dashboardService.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setSnackbar({ open: true, message: 'Tenant deleted successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete tenant', severity: 'error' });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ tenantId, unitId, leaseStart, leaseEnd }: { tenantId: string; unitId: string; leaseStart: Date; leaseEnd?: Date }) =>
      dashboardService.assignTenantToUnit(tenantId, unitId, leaseStart, leaseEnd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setSnackbar({ open: true, message: 'Tenant assigned successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to assign tenant', severity: 'error' });
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: ({ tenantIds, unitIds, leaseStart, leaseEnd }: { tenantIds: string[]; unitIds: string[]; leaseStart: Date; leaseEnd?: Date }) =>
      dashboardService.bulkAssign(tenantIds, unitIds, leaseStart, leaseEnd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setSnackbar({ open: true, message: 'Bulk assignment successful', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to bulk assign', severity: 'error' });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (assignmentId: string) => dashboardService.unassignTenant(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setSnackbar({ open: true, message: 'Tenant unassigned successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to unassign tenant', severity: 'error' });
    },
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleOpenForm = (isEdit: boolean = false, tenant: Partial<Tenant> = {}) => {
    setEditMode(isEdit);
    setSelectedTenant(tenant);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedTenant({});
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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to fetch tenants</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Tenants
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'end', flexWrap: 'wrap' }}>
          <TextField
            label="Search Tenants"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name or email..."
            sx={{ minWidth: 300 }}
          />
          <Button variant="contained" onClick={() => handleOpenForm(false)}>
            Add Tenant
          </Button>
          {selectedTenants.length > 0 && (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                setAssignMode('bulk');
                setOpenAssignModal(true);
              }}
              startIcon={<AssignmentIcon />}
              disabled={bulkAssignMutation.isPending}
            >
              Assign Selected ({selectedTenants.length})
            </Button>
          )}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AssignmentIcon />}
            onClick={() => {
              setAssignMode('assign');
              setCurrentTenantId(undefined);
              setOpenAssignModal(true);
            }}
          >
            Assign Tenant
          </Button>
        </Box>
      </Box>

      <TenantForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmitSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tenants'] });
          setSnackbar({ open: true, message: 'Tenant saved successfully', severity: 'success' });
        }}
        initialValues={selectedTenant}
        isEdit={editMode}
        tenantId={editMode ? selectedTenant.id : undefined}
      />

      <TableContainer component={Paper} sx={{ minHeight: 400 }}>
        <Table aria-label="Tenants table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedTenants.length > 0 && selectedTenants.length < (data?.tenants?.length || 0)}
                  checked={(data?.tenants?.length || 0) > 0 && selectedTenants.length === data?.tenants.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTenants(data?.tenants?.map(t => t.id) || []);
                    } else {
                      setSelectedTenants([]);
                    }
                  }}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Lease Start</TableCell>
              <TableCell>Lease End</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.tenants.map((tenant: Tenant) => (
              <TableRow key={tenant.id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedTenants.includes(tenant.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTenants([...selectedTenants, tenant.id]);
                      } else {
                        setSelectedTenants(selectedTenants.filter(id => id !== tenant.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{tenant.name}</TableCell>
                <TableCell>{tenant.email}</TableCell>
                <TableCell>{tenant.phone || 'N/A'}</TableCell>
                <TableCell>{new Date(tenant.leaseStart).toLocaleDateString()}</TableCell>
                <TableCell>{tenant.leaseEnd ? new Date(tenant.leaseEnd).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>{tenant.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenForm(true, tenant)} aria-label="Edit tenant">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleOpenDelete(tenant.id)} aria-label="Delete tenant">
                    <DeleteIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setCurrentTenantId(tenant.id);
                      setAssignMode('assign');
                      setOpenAssignModal(true);
                    }}
                    aria-label="Assign unit"
                  >
                    <AssignmentIcon />
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
          aria-label="Tenant list pagination"
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this tenant? This action cannot be undone.
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
    
      {/* Assignment Modal */}
      <AssignmentModal
        open={openAssignModal}
        onClose={() => setOpenAssignModal(false)}
        tenantId={assignMode === 'assign' ? currentTenantId : undefined}
        tenantIds={assignMode === 'bulk' ? selectedTenants : undefined}
        mode={assignMode}
        propertyId={undefined} // No property context in global list
        onSubmit={(data) => {
          if (data.mode === 'assign') {
            assignMutation.mutate({
              tenantId: data.tenantId,
              unitId: data.unitId,
              leaseStart: data.leaseStart,
              leaseEnd: data.leaseEnd,
            });
          } else if (data.mode === 'bulk') {
            bulkAssignMutation.mutate({
              tenantIds: data.tenantIds,
              unitIds: data.unitIds,
              leaseStart: data.leaseStart,
              leaseEnd: data.leaseEnd,
            });
          } else if (data.mode === 'unassign') {
            // Assume data has assignmentId
            unassignMutation.mutate(data.assignmentId);
          }
          setOpenAssignModal(false);
          if (assignMode === 'assign') {
            setCurrentTenantId(undefined);
          } else {
            setSelectedTenants([]);
          }
        }}
      />
    </Box>

  );
};

export default TenantList;