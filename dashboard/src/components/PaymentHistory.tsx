import React, { useState } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api'; // Assume existing api instance

const columns = [
  { 
    field: 'invoiceNumber', 
    headerName: 'Invoice #', 
    width: 120,
    renderCell: (params) => `#${params.value}`
  },
  { 
    field: 'amount', 
    headerName: 'Amount', 
    width: 120,
    valueFormatter: (params) => `$${params.value}`,
    align: 'right'
  },
  { 
    field: 'status', 
    headerName: 'Status', 
    width: 150,
    renderCell: (params) => {
      const color = params.value === 'paid' ? 'success' : params.value === 'pending' ? 'warning' : 'error';
      return <Chip label={params.value} color={color} size="small" />;
    }
  },
  { 
    field: 'date', 
    headerName: 'Date', 
    width: 150,
    valueFormatter: (params) => new Date(params.value).toLocaleDateString()
  },
  { 
    field: 'invoiceDueDate', 
    headerName: 'Due Date', 
    width: 150,
    valueFormatter: (params) => new Date(params.value).toLocaleDateString()
  }
] as GridColDef[];

const PaymentHistory = () => {
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
  const userId = localStorage.getItem('userId'); // Assume from auth
  const role = localStorage.getItem('role'); // 'tenant' or 'owner'

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', userId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (role === 'owner') params.append('role', 'owner');

      // Get vendorId from user context - this might need to be adjusted based on your user model
      const vendorId = localStorage.getItem('vendorId') || userId;

      const response = await api.get(`/vendor-payments/history/${vendorId}?${params}`);
      return response.data;
    },
    refetchInterval: 30000, // Poll every 30s
    enabled: !!userId // Only run query if userId exists
  });

  if (isLoading) return <div>Loading payment history...</div>;
  if (error) return <div>Error loading payments: {error.message}</div>;

  const rows = data || [];

  return (
    <div style={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } }
        }}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 }
          }
        }}
        sx={{
          '& .MuiDataGrid-cell': {
            ariaLabel: 'Payment history cell' // Basic ARIA
          }
        }}
        pageSizeOptions={[5, 10, 25]}
        checkboxSelection
        disableRowSelectionOnClick
        aria-label="Payment history table"
      />
    </div>
  );
};

export default PaymentHistory;