import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PaymentHistory from '../../dashboard/src/components/PaymentHistory';
import { api } from '../../dashboard/src/services/api'; // Mock

// Mock api
jest.mock('../../dashboard/src/services/api', () => ({
  api: {
    get: jest.fn()
  }
}));

const mockPayments = [
  {
    id: 1,
    amount: 1200,
    status: 'paid',
    date: '2023-10-01',
    invoiceNumber: 'INV001',
    invoiceDueDate: '2023-10-01',
    invoiceAmount: 1200
  },
  {
    id: 2,
    amount: 1200,
    status: 'pending',
    date: '2023-10-15',
    invoiceNumber: 'INV002',
    invoiceDueDate: '2023-10-15',
    invoiceAmount: 1200
  }
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
});

describe('PaymentHistory', () => {
  beforeEach(() => {
    localStorage.setItem('userId', '123');
    localStorage.setItem('role', 'tenant');
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    api.get.mockReturnValue(Promise.resolve({ data: { payments: [] } }));
    render(
      <QueryClientProvider client={queryClient}>
        <PaymentHistory />
      </QueryClientProvider>
    );
    expect(screen.getByText('Loading payment history...')).toBeInTheDocument();
  });

  it('renders payment history data', async () => {
    api.get.mockResolvedValue({ data: { payments: mockPayments } });

    render(
      <QueryClientProvider client={queryClient}>
        <PaymentHistory />
      </QueryClientProvider>
    );

    expect(await screen.findByText('#INV001')).toBeInTheDocument();
    expect(screen.getByText('$1200')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
    expect(screen.getByText('2023-10-01')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    api.get.mockRejectedValue(new Error('Network error'));

    render(
      <QueryClientProvider client={queryClient}>
        <PaymentHistory />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Error loading payments/)).toBeInTheDocument();
  });

  it('filters by status', async () => {
    api.get.mockResolvedValue({ data: { payments: mockPayments } });

    render(
      <QueryClientProvider client={queryClient}>
        <PaymentHistory />
      </QueryClientProvider>
    );

    // Simulate filter via toolbar quick filter
    const quickFilter = screen.getByRole('textbox', { name: /search/i });
    fireEvent.change(quickFilter, { target: { value: 'paid' } });

    // Wait for refetch
    await screen.findByText('paid'); // Should still show, but test refetch call
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('status=paid'));
  });

  it('has proper ARIA labels', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PaymentHistory />
      </QueryClientProvider>
    );

    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'Payment history table');
  });
});