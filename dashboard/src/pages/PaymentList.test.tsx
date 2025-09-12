import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../design-system/theme';
import PaymentList from './PaymentList';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    getPaymentRecords: jest.fn(),
    deletePaymentRecord: jest.fn(),
  },
}));

const mockGetPaymentRecords = dashboardService.getPaymentRecords as jest.MockedFunction<typeof dashboardService.getPaymentRecords>;
const mockDeletePaymentRecord = dashboardService.deletePaymentRecord as jest.MockedFunction<typeof dashboardService.deletePaymentRecord>;

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('PaymentList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockGetPaymentRecords.mockReturnValue(new Promise(() => {})); // Simulate loading

    renderWithProviders(<PaymentList />);

    expect(screen.getByText('Payment Records')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    const error = new Error('API error');
    mockGetPaymentRecords.mockRejectedValue(error);

    renderWithProviders(<PaymentList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch payment records')).toBeInTheDocument();
    });
  });

  it('renders empty state', async () => {
    mockGetPaymentRecords.mockResolvedValue({ data: [], total: 0 });

    renderWithProviders(<PaymentList />);

    await waitFor(() => {
      expect(screen.getByText('Payment Records')).toBeInTheDocument();
      // Should show table headers but no data rows
      expect(screen.getByText('Tenant Name')).toBeInTheDocument();
    });
  });

  it('renders payment records', async () => {
    const mockPayments = [
      {
        id: '1',
        tenantId: 't1',
        leaseId: 'l1',
        amount: 1500,
        paymentMethod: 'cash' as const,
        paymentDate: '2024-01-01',
        status: 'completed' as const,
        notes: 'Test payment',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        tenantName: 'John Doe',
        leaseDetails: 'Unit 101 - 123 Main St',
      },
    ];
    mockGetPaymentRecords.mockResolvedValue({ data: mockPayments, total: 1 });

    renderWithProviders(<PaymentList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Unit 101 - 123 Main St')).toBeInTheDocument();
      expect(screen.getByText('$1500.00')).toBeInTheDocument();
      expect(screen.getByText('Cash')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    mockGetPaymentRecords.mockResolvedValue({ data: [], total: 0 });

    renderWithProviders(<PaymentList />);

    const searchInput = screen.getByLabelText('Search Records');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(mockGetPaymentRecords).toHaveBeenCalledWith(
        1, 10, 'John', '', '', '', ''
      );
    });
  });

  it('handles status filter', async () => {
    mockGetPaymentRecords.mockResolvedValue({ data: [], total: 0 });

    renderWithProviders(<PaymentList />);

    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    const completedOption = screen.getByText('Completed');
    fireEvent.click(completedOption);

    await waitFor(() => {
      expect(mockGetPaymentRecords).toHaveBeenCalledWith(
        1, 10, '', 'completed', '', '', ''
      );
    });
  });

  it('handles delete confirmation', async () => {
    const mockPayments = [
      {
        id: '1',
        tenantId: 't1',
        leaseId: 'l1',
        amount: 1500,
        paymentMethod: 'cash' as const,
        paymentDate: '2024-01-01',
        status: 'completed' as const,
        notes: 'Test payment',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        tenantName: 'John Doe',
        leaseDetails: 'Unit 101 - 123 Main St',
      },
    ];
    mockGetPaymentRecords.mockResolvedValue({ data: mockPayments, total: 1 });
    mockDeletePaymentRecord.mockResolvedValue(undefined);

    renderWithProviders(<PaymentList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Delete payment');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();

    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeletePaymentRecord).toHaveBeenCalledWith('1');
    });
  });

  it('shows success snackbar after delete', async () => {
    const mockPayments = [
      {
        id: '1',
        tenantId: 't1',
        leaseId: 'l1',
        amount: 1500,
        paymentMethod: 'cash' as const,
        paymentDate: '2024-01-01',
        status: 'completed' as const,
        notes: 'Test payment',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        tenantName: 'John Doe',
        leaseDetails: 'Unit 101 - 123 Main St',
      },
    ];
    mockGetPaymentRecords.mockResolvedValue({ data: mockPayments, total: 1 });
    mockDeletePaymentRecord.mockResolvedValue(undefined);

    renderWithProviders(<PaymentList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Delete payment');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Payment record deleted successfully')).toBeInTheDocument();
    });
  });
});