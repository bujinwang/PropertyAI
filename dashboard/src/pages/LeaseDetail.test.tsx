import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import LeaseDetail from './LeaseDetail';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getLeases: jest.fn(),
    getPayments: jest.fn(),
    markPaymentPaid: jest.fn(),
  },
}));

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('LeaseDetail', () => {
  const mockLease = {
    id: 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    rentAmount: 1500,
    paymentFrequency: 'monthly' as const,
    status: 'active' as const,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    tenantName: 'John Doe',
    unitAddress: '123 Main St, Unit 101',
  };

  const mockPayments = [
    {
      id: 'payment-1',
      leaseId: 'lease-1',
      amount: 1500,
      dueDate: '2024-01-01',
      status: 'paid' as const,
      paidDate: '2024-01-01',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 'payment-2',
      leaseId: 'lease-1',
      amount: 1500,
      dueDate: '2024-02-01',
      status: 'pending' as const,
      paidDate: undefined,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDashboardService.getLeases.mockResolvedValue({
      data: [mockLease],
      total: 1,
    });
    mockDashboardService.getPayments.mockResolvedValue(mockPayments);
  });

  it('renders lease overview correctly', async () => {
    renderWithProviders(<LeaseDetail />);

    await waitFor(() => {
      expect(screen.getByText('Lease Details')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Unit 101')).toBeInTheDocument();
    expect(screen.getByText('1/1/2024')).toBeInTheDocument();
    expect(screen.getByText('12/31/2024')).toBeInTheDocument();
    expect(screen.getByText('$1,500')).toBeInTheDocument();
    expect(screen.getByText('monthly')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders payments tab with payment history', async () => {
    renderWithProviders(<LeaseDetail />);

    await waitFor(() => {
      expect(screen.getByText('Lease Details')).toBeInTheDocument();
    });

    // Switch to payments tab
    const paymentsTab = screen.getByRole('tab', { name: /payments/i });
    fireEvent.click(paymentsTab);

    await waitFor(() => {
      expect(screen.getByText('Payment History')).toBeInTheDocument();
    });

    expect(screen.getByText('$1,500')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('marks payment as paid when button is clicked', async () => {
    mockDashboardService.markPaymentPaid.mockResolvedValue({
      ...mockPayments[1],
      status: 'paid',
      paidDate: '2024-01-15',
    });

    renderWithProviders(<LeaseDetail />);

    await waitFor(() => {
      expect(screen.getByText('Lease Details')).toBeInTheDocument();
    });

    // Switch to payments tab
    const paymentsTab = screen.getByRole('tab', { name: /payments/i });
    fireEvent.click(paymentsTab);

    await waitFor(() => {
      expect(screen.getByText('Payment History')).toBeInTheDocument();
    });

    // Find and click the mark paid button for pending payment
    const markPaidButtons = screen.getAllByLabelText('Mark as paid');
    const pendingPaymentButton = markPaidButtons[1]; // Second payment is pending
    fireEvent.click(pendingPaymentButton);

    await waitFor(() => {
      expect(mockDashboardService.markPaymentPaid).toHaveBeenCalledWith('payment-2');
    });
  });

  it('shows back to leases link', async () => {
    renderWithProviders(<LeaseDetail />);

    await waitFor(() => {
      expect(screen.getByText('Lease Details')).toBeInTheDocument();
    });

    expect(screen.getByText('Back to Leases')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderWithProviders(<LeaseDetail />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error when lease not found', async () => {
    mockDashboardService.getLeases.mockResolvedValue({
      data: [],
      total: 0,
    });

    renderWithProviders(<LeaseDetail />);

    await waitFor(() => {
      expect(screen.getByText('Lease not found')).toBeInTheDocument();
    });
  });
});