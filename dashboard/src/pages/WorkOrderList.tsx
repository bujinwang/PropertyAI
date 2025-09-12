import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Skeleton,
  Alert,
  Box,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Paper,
  Snackbar,
} from '@mui/material';
import { Alert as MuiAlert } from '@mui/material';
import {
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { queryKeys } from '../config/queryClient';
import { dashboardService, WorkOrder } from '../services/dashboardService';
import WorkOrderForm from '../components/WorkOrderForm';

const WorkOrderList: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | undefined>();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.workOrders(),
    queryFn: () => dashboardService.getWorkOrders(page + 1, rowsPerPage, searchTerm || undefined),
  });

  const workOrders = response?.data || [];
  const totalCount = response?.total || 0;

  const getStatusIcon = (status: WorkOrder['status']) => {
    switch (status) {
      case 'pending':
        return <ScheduleIcon color="warning" />;
      case 'in progress':
        return <BuildIcon color="info" />;
      case 'completed':
        return <CheckCircleIcon color="success" />;
      default:
        return <BuildIcon />;
    }
  };

  const getStatusColor = (status: WorkOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in progress':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleEdit = (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingWorkOrder(undefined);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingWorkOrder(undefined);
  };

  const handleFormSubmitSuccess = () => {
    refetch();
    setSnackbar({
      open: true,
      message: editingWorkOrder ? 'Work order updated successfully' : 'Work order created successfully',
      severity: 'success'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader
          title={<Skeleton variant="text" width="60%" aria-label="Loading work orders" />}
          subheader={<Skeleton variant="text" width="40%" />}
        />
        <CardContent>
          <Skeleton variant="rectangular" height={400} aria-label="Loading work orders content" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Work Orders" />
        <CardContent>
          <Alert severity="error" role="alert" aria-live="polite">
            Failed to load work orders: {(error as Error).message}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Work Orders"
        subheader={
          <Box display="flex" alignItems="center" gap={1}>
            <Chip label={totalCount} color="primary" size="small" />
            <Typography variant="body2" color="text.secondary">
              {totalCount} work order{totalCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
        }
        action={
          <Tooltip title="Create Work Order">
            <IconButton
              color="primary"
              onClick={handleCreate}
              aria-label="Create work order"
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search work orders by description or assigned staff..."
          value={searchTerm}
          onChange={handleSearch}
          sx={{ mb: 2 }}
        />
        {workOrders.length === 0 ? (
          <Typography color="text.secondary">No work orders found</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table aria-label="work orders table">
              <TableHead>
                <TableRow>
                  <TableCell>Request Description</TableCell>
                  <TableCell>Tenant/Unit</TableCell>
                  <TableCell>Assigned Staff</TableCell>
                  <TableCell>Scheduled Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Completed Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workOrders.map((workOrder) => (
                  <TableRow key={workOrder.id} hover>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {workOrder.requestDescription || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {workOrder.tenantName || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {workOrder.unitNumber || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>{workOrder.assignedStaff}</TableCell>
                    <TableCell>
                      {new Date(workOrder.scheduledDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(workOrder.status)}
                        <Chip
                          label={workOrder.status.replace(' ', ' ')}
                          size="small"
                          color={getStatusColor(workOrder.status)}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {workOrder.completedDate
                        ? new Date(workOrder.completedDate).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Work Order">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(workOrder)}
                          aria-label="Edit work order"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        )}
      </CardContent>

      <WorkOrderForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmitSuccess={handleFormSubmitSuccess}
        initialValues={editingWorkOrder}
        isEdit={!!editingWorkOrder}
        workOrderId={editingWorkOrder?.id}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Card>
  );
};

export default WorkOrderList;