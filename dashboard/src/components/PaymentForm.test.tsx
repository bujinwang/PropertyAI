import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from '../design-system/theme';
import PaymentForm from './PaymentForm';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    getTenants: jest.fn(),
    getLeases: jest.fn(),
    createPaymentRecord: jest.fn(),
    updatePaymentRecord: jest.fn(),
  },
}));

const mockGetTenants = dashboardService.getTenants as jest.MockedFunction<typeof dashboardService.getTenants>;
const mockGetLeases = dashboardService.getLeases as jest.MockedFunction<typeof dashboardService.getLeases>;
const mockCreatePaymentRecord = dashboardService.createPaymentRecord as jest.MockedFunction<typeof dashboardService.createPaymentRecord>;
const mockUpdatePaymentRecord = dashboardService.updatePaymentRecord as jest.MockedFunction<typeof dashboardService.updatePaymentRecord>;

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
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {component}
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const mockTenants = [
  {
    id: 't1',
    name: 'John Doe',
    email: 'john@example.com',
    leaseStart: '2024-01-01',
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 't2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    leaseStart: '2024-01-01',
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockLeases = [
  {
    id: 'l1',
    tenantId: 't1',
    unitId: 'u1',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    rentAmount: 1500,
    paymentFrequency: 'monthly' as const,
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tenantName: 'John Doe',
    unitAddress: '123 Main St, Unit 101',
  },
];

describe('PaymentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTenants.mockResolvedValue({ data: mockTenants, total: 2 });
    mockGetLeases.mockResolvedValue({ data: mockLeases, total: 1 });
  });

  it('renders create form correctly', async () => {
    renderWithProviders(
      <PaymentForm
        open={true}
        onClose={jest.fn()}
        onSubmitSuccess={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Create New Payment Record')).toBeInTheDocument();
      expect(screen.getByLabelText('Tenant')).toBeInTheDocument();
      expect(screen.getByLabelText('Lease')).toBeInTheDocument();
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Payment Method')).toBeInTheDocument();
      expect(screen.getByLabelText('Payment Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    });
  });

  it('renders edit form correctly', async () => {
    const initialValues = {
      tenantId: 't1',
      leaseId: 'l1',
      amount: 1500,
      paymentMethod: 'cash' as const,
      paymentDate: '2024-01-01',
      status: 'completed' as const,
      notes: 'Test payment',
    };

    renderWithProviders(
      <PaymentForm
        open={true}
        onClose={jest.fn()}
        onSubmitSuccess={jest.fn()}
        initialValues={initialValues}
        isEdit={true}
        paymentId="p1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Payment Record')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    mockCreatePaymentRecord.mockResolvedValue({} as any);

    renderWithProviders(
      <PaymentForm
        open={true}
        onClose={jest.fn()}
        onSubmitSuccess={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreatePaymentRecord).not.toHaveBeenCalled();
    });
  });

  it('submits create form successfully', async () => {
    mockCreatePaymentRecord.mockResolvedValue({
      id: 'p1',
      tenantId: 't1',
      leaseId: 'l1',
      amount: 1500,
      paymentMethod: 'cash',
      paymentDate: '2024-01-01',
      status: 'completed',
      notes: 'Test payment',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });

    const onSubmitSuccess = jest.fn();
    const onClose = jest.fn();

    renderWithProviders(
      <PaymentForm
        open={true}
        onClose={onClose}
        onSubmitSuccess={onSubmitSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    // Fill out the form
    const amountInput = screen.getByLabelText('Amount');
    fireEvent.change(amountInput, { target: { value: '1500' } });

    const notesInput = screen.getByLabelText('Notes');
    fireEvent.change(notesInput, { target: { value: 'Test payment' } });

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreatePaymentRecord).toHaveBeenCalled();
      expect(onSubmitSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('submits edit form successfully', async () => {
    mockUpdatePaymentRecord.mockResolvedValue({
      id: 'p1',
      tenantId: 't1',
      leaseId: 'l1',
      amount: 1600,
      paymentMethod: 'check',
      paymentDate: '2024-01-01',
      status: 'completed',
      notes: 'Updated payment',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });

    const onSubmitSuccess = jest.fn();
    const onClose = jest.fn();

    renderWithProviders(
      <PaymentForm
        open={true}
        onClose={onClose}
        onSubmitSuccess={onSubmitSuccess}
        initialValues={{
          tenantId: 't1',
          leaseId: 'l1',
          amount: 1500,
          paymentMethod: 'cash',
          paymentDate: '2024-01-01',
          status: 'pending',
          notes: 'Test payment',
        }}
        isEdit={true}
        paymentId="p1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Update');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdatePaymentRecord).toHaveBeenCalledWith('p1', expect.any(Object));
      expect(onSubmitSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = jest.fn();

    renderWithProviders(
      <PaymentForm
        open={true}
        onClose={onClose}
        onSubmitSuccess={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});