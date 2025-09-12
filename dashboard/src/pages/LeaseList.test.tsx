import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeaseList from './LeaseList';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getLeases: jest.fn(),
    deleteLease: jest.fn(),
  },
}));

// Mock the LeaseForm component
jest.mock('../components/LeaseForm', () => {
  return function MockLeaseForm({ open, onClose, onSubmitSuccess }: any) {
    return open ? (
      <div data-testid="lease-form">
        <button onClick={onClose}>Close</button>
        <button onClick={onSubmitSuccess}>Submit</button>
      </div>
    ) : null;
  };
});

// Create a test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const mockLeases = [
  {
    id: '1',
    tenantId: 'tenant1',
    unitId: 'unit1',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    rentAmount: 1500,
    paymentFrequency: 'monthly' as const,
    status: 'active' as const,
    tenantName: 'John Doe',
    unitAddress: '123 Main St',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    tenantId: 'tenant2',
    unitId: 'unit2',
    startDate: '2024-02-01',
    endDate: '2024-12-31',
    rentAmount: 1200,
    paymentFrequency: 'monthly' as const,
    status: 'active' as const,
    tenantName: 'Jane Smith',
    unitAddress: '456 Oak Ave',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
];

describe('LeaseList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dashboardService.getLeases as jest.Mock).mockResolvedValue({
      data: mockLeases,
      total: 2,
    });
  });

  it('renders the lease list with data', async () => {
    render(<LeaseList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Leases')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    (dashboardService.getLeases as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<LeaseList />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    render(<LeaseList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Leases')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search Leases');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(dashboardService.getLeases).toHaveBeenCalledWith(1, 10, 'John');
    });
  });

  it('opens add lease form when Add Lease button is clicked', async () => {
    render(<LeaseList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Leases')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Lease');
    fireEvent.click(addButton);

    expect(screen.getByTestId('lease-form')).toBeInTheDocument();
  });

  it('opens edit form when edit button is clicked', async () => {
    render(<LeaseList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Leases')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByLabelText('Edit lease');
    fireEvent.click(editButtons[0]);

    expect(screen.getByTestId('lease-form')).toBeInTheDocument();
  });

  it('opens delete confirmation dialog when delete button is clicked', async () => {
    render(<LeaseList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Leases')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete lease');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this lease? This action cannot be undone.')).toBeInTheDocument();
  });

  it('deletes lease when confirmed', async () => {
    (dashboardService.deleteLease as jest.Mock).mockResolvedValue(undefined);

    render(<LeaseList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Leases')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete lease');
    fireEvent.click(deleteButtons[0]);

    const deleteConfirmButton = screen.getByText('Delete');
    fireEvent.click(deleteConfirmButton);

    await waitFor(() => {
      expect(dashboardService.deleteLease).toHaveBeenCalledWith('1');
    });
  });

  it('shows success snackbar after successful delete', async () => {
    (dashboardService.deleteLease as jest.Mock).mockResolvedValue(undefined);

    render(<LeaseList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Leases')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete lease');
    fireEvent.click(deleteButtons[0]);

    const deleteConfirmButton = screen.getByText('Delete');
    fireEvent.click(deleteConfirmButton);

    await waitFor(() => {
      expect(screen.getByText('Lease deleted successfully')).toBeInTheDocument();
    });
  });

  it('shows error snackbar when delete fails', async () => {
    (dashboardService.deleteLease as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    render(<LeaseList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Leases')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete lease');
    fireEvent.click(deleteButtons[0]);

    const deleteConfirmButton = screen.getByText('Delete');
    fireEvent.click(deleteConfirmButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete lease')).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    render(<LeaseList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Leases')).toBeInTheDocument();
    });

    const pagination = screen.getByLabelText('Lease list pagination');
    fireEvent.click(pagination);

    // Note: This is a basic test. In a real scenario, you'd test specific page changes
    expect(pagination).toBeInTheDocument();
  });
});