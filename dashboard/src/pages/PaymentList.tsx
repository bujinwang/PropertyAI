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
import DownloadIcon from '@mui/icons-material/Download';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, PaymentRecord } from '../services/dashboardService';

import PaymentForm from '../components/PaymentForm';

const PaymentList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const limit = 10;
  const queryClient = useQueryClient();

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  const [openForm, setOpenForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Partial<PaymentRecord>>({});

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['payment-records', page, searchTerm, statusFilter, methodFilter, dateFrom, dateTo],
    queryFn: () => dashboardService.getPaymentRecords(page, limit, searchTerm, statusFilter, methodFilter, dateFrom, dateTo),
    select: (response) => ({
      payments: response.data,
      total: response.total,
    }),
  });

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dashboardService.deletePaymentRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-records'] });
      setSnackbar({ open: true, message: 'Payment record deleted successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete payment record', severity: 'error' });
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

  const handleMethodFilterChange = (event: any) => {
    setMethodFilter(event.target.value as string);
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

  const handleOpenForm = (isEdit: boolean = false, payment: Partial<PaymentRecord> = {}) => {
    setEditMode(isEdit);
    setSelectedPayment(payment);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedPayment({});
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

  const handleExport = (format: string) => {
    if (!data?.payments || data.payments.length === 0) {
      setSnackbar({ open: true, message: 'No payment records to export', severity: 'warning' });
      return;
    }

    if (format === 'csv') {
      exportToCSV(data.payments);
    } else if (format === 'json') {
      exportToJSON(data.payments);
    }
  };

  const exportToCSV = (payments: PaymentRecord[]) => {
    const headers = ['Tenant Name', 'Lease Details', 'Amount', 'Payment Method', 'Status', 'Payment Date', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...payments.map(payment => [
        `"${payment.tenantName || ''}"`,
        `"${payment.leaseDetails || ''}"`,
        payment.amount,
        `"${payment.paymentMethod.replace('_', ' ')}"`,
        payment.status,
        payment.paymentDate,
        `"${payment.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payment-records-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSnackbar({ open: true, message: 'Payment records exported to CSV', severity: 'success' });
  };

  const exportToJSON = (payments: PaymentRecord[]) => {
    const jsonContent = JSON.stringify(payments, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payment-records-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSnackbar({ open: true, message: 'Payment records exported to JSON', severity: 'success' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'success';
      case 'check': return 'info';
      case 'bank_transfer': return 'primary';
      case 'credit_card': return 'secondary';
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
    return <Alert severity="error">Failed to fetch payment records</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Payment Records
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'end', flexWrap: 'wrap' }}>
          <TextField
            label="Search Records"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by tenant name or lease details..."
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
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Method</InputLabel>
            <Select
              value={methodFilter}
              label="Method"
              onChange={handleMethodFilterChange}
            >
              <MenuItem value="">
                <em>All Methods</em>
              </MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="check">Check</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="credit_card">Credit Card</MenuItem>
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

          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('csv')} sx={{ mr: 1 }}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm(false)}>
            Add Payment
          </Button>
        </Box>
      </Box>

      <PaymentForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmitSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['payment-records'] });
          setSnackbar({ open: true, message: 'Payment record saved successfully', severity: 'success' });
        }}
        initialValues={selectedPayment}
        isEdit={editMode}
        paymentId={editMode ? selectedPayment.id : undefined}
      />

      <TableContainer component={Paper} sx={{ minHeight: 400 }}>
        <Table aria-label="Payment records table">
          <TableHead>
            <TableRow>
              <TableCell>Tenant Name</TableCell>
              <TableCell>Lease Details</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.payments.map((payment: PaymentRecord) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.tenantName || 'N/A'}</TableCell>
                <TableCell>{payment.leaseDetails || 'N/A'}</TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={payment.paymentMethod.replace('_', ' ')}
                    color={getMethodColor(payment.paymentMethod) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={payment.status}
                    color={getStatusColor(payment.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenForm(true, payment)} aria-label="Edit payment">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleOpenDelete(payment.id)} aria-label="Delete payment">
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
          aria-label="Payment records pagination"
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this payment record? This action cannot be undone.
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

export default PaymentList;