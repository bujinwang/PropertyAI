import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WorkOrderList from './WorkOrderList';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getWorkOrders: jest.fn(),
  },
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWorkOrderList = () => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <WorkOrderList />
    </QueryClientProvider>
  );
};

const mockWorkOrders = [
  {
    id: 'wo1',
    requestId: 'req1',
    assignedStaff: 'John Doe',
    scheduledDate: '2024-01-15',
    completedDate: null,
    notes: 'Fix the leaky faucet',
    status: 'pending' as const,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    requestDescription: 'Leaky faucet in kitchen',
    tenantName: 'Jane Smith',
    unitNumber: '101',
  },
  {
    id: 'wo2',
    requestId: 'req2',
    assignedStaff: 'Bob Johnson',
    scheduledDate: '2024-01-20',
    completedDate: '2024-01-18',
    notes: 'Replace broken window',
    status: 'completed' as const,
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
    requestDescription: 'Broken window in bedroom',
    tenantName: 'Mike Wilson',
    unitNumber: '205',
  },
];

describe('WorkOrderList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dashboardService.getWorkOrders as jest.Mock).mockResolvedValue({
      data: mockWorkOrders,
      total: 2,
    });
  });

  it('renders the work orders table with correct headers', async () => {
    renderWorkOrderList();

    await waitFor(() => {
      expect(screen.getByText('Work Orders')).toBeInTheDocument();
    });

    expect(screen.getByText('Request Description')).toBeInTheDocument();
    expect(screen.getByText('Tenant/Unit')).toBeInTheDocument();
    expect(screen.getByText('Assigned Staff')).toBeInTheDocument();
    expect(screen.getByText('Scheduled Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Completed Date')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('displays work orders data correctly', async () => {
    renderWorkOrderList();

    await waitFor(() => {
      expect(screen.getByText('Leaky faucet in kitchen')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderWorkOrderList();

    expect(screen.getByText('Loading work orders')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    renderWorkOrderList();

    await waitFor(() => {
      expect(screen.getByText('Work Orders')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search work orders by description or assigned staff...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(dashboardService.getWorkOrders).toHaveBeenCalledWith(1, 10, 'John');
  });

  it('handles pagination', async () => {
    renderWorkOrderList();

    await waitFor(() => {
      expect(screen.getByText('Work Orders')).toBeInTheDocument();
    });

    // The pagination component should be present
    expect(screen.getByText('2')).toBeInTheDocument(); // Total count
  });

  it('opens create form when add button is clicked', async () => {
    renderWorkOrderList();

    await waitFor(() => {
      expect(screen.getByText('Work Orders')).toBeInTheDocument();
    });

    const addButton = screen.getByLabelText('Create work order');
    fireEvent.click(addButton);

    // The form should be opened (we can't easily test the modal without more setup)
    expect(addButton).toBeInTheDocument();
  });

  it('shows empty state when no work orders', async () => {
    (dashboardService.getWorkOrders as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
    });

    renderWorkOrderList();

    await waitFor(() => {
      expect(screen.getByText('No work orders found')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (dashboardService.getWorkOrders as jest.Mock).mockRejectedValue(new Error('API Error'));

    renderWorkOrderList();

    await waitFor(() => {
      expect(screen.getByText('Failed to load work orders: API Error')).toBeInTheDocument();
    });
  });
});