import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MaintenanceRequestList from './MaintenanceRequestList';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getMaintenanceRequests: jest.fn(),
    deleteMaintenanceRequest: jest.fn(),
  },
}));

// Mock the MaintenanceRequestForm component
jest.mock('../components/MaintenanceRequestForm', () => {
  return function MockMaintenanceRequestForm({ open, onClose, onSubmitSuccess }: any) {
    return open ? (
      <div data-testid="maintenance-request-form">
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

const mockMaintenanceRequests = [
  {
    id: '1',
    tenantId: 'tenant1',
    unitId: 'unit1',
    propertyId: 'prop1',
    description: 'Leaky faucet in kitchen',
    priority: 'high' as const,
    status: 'pending' as const,
    submittedAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tenantName: 'John Doe',
    unitAddress: '123 Main St',
  },
  {
    id: '2',
    tenantId: 'tenant2',
    unitId: 'unit2',
    propertyId: 'prop1',
    description: 'Broken window',
    priority: 'medium' as const,
    status: 'in progress' as const,
    submittedAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    tenantName: 'Jane Smith',
    unitAddress: '456 Oak Ave',
  },
];

describe('MaintenanceRequestList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dashboardService.getMaintenanceRequests as jest.Mock).mockResolvedValue({
      data: mockMaintenanceRequests,
      total: 2,
    });
  });

  it('renders the maintenance request list with data', async () => {
    render(<MaintenanceRequestList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
    expect(screen.getByText('Leaky faucet in kitchen')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    (dashboardService.getMaintenanceRequests as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<MaintenanceRequestList />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    render(<MaintenanceRequestList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search Requests');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(dashboardService.getMaintenanceRequests).toHaveBeenCalledWith(1, 10, 'John', '', '');
    });
  });

  it('handles status filter', async () => {
    render(<MaintenanceRequestList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    const pendingOption = screen.getByText('Pending');
    fireEvent.click(pendingOption);

    await waitFor(() => {
      expect(dashboardService.getMaintenanceRequests).toHaveBeenCalledWith(1, 10, '', 'pending', '');
    });
  });

  it('handles priority filter', async () => {
    render(<MaintenanceRequestList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    });

    const prioritySelect = screen.getByLabelText('Priority');
    fireEvent.mouseDown(prioritySelect);
    const highOption = screen.getByText('High');
    fireEvent.click(highOption);

    await waitFor(() => {
      expect(dashboardService.getMaintenanceRequests).toHaveBeenCalledWith(1, 10, '', '', 'high');
    });
  });

  it('opens add request form when Add Request button is clicked', async () => {
    render(<MaintenanceRequestList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Request');
    fireEvent.click(addButton);

    expect(screen.getByTestId('maintenance-request-form')).toBeInTheDocument();
  });

  it('opens edit form when edit button is clicked', async () => {
    render(<MaintenanceRequestList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByLabelText('Edit request');
    fireEvent.click(editButtons[0]);

    expect(screen.getByTestId('maintenance-request-form')).toBeInTheDocument();
  });

  it('opens delete confirmation dialog when delete button is clicked', async () => {
    render(<MaintenanceRequestList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete request');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this maintenance request? This action cannot be undone.')).toBeInTheDocument();
  });

  it('deletes request when confirmed', async () => {
    (dashboardService.deleteMaintenanceRequest as jest.Mock).mockResolvedValue(undefined);

    render(<MaintenanceRequestList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete request');
    fireEvent.click(deleteButtons[0]);

    const deleteConfirmButton = screen.getByText('Delete');
    fireEvent.click(deleteConfirmButton);

    await waitFor(() => {
      expect(dashboardService.deleteMaintenanceRequest).toHaveBeenCalledWith('1');
    });
  });

  it('shows success snackbar after successful delete', async () => {
    (dashboardService.deleteMaintenanceRequest as jest.Mock).mockResolvedValue(undefined);

    render(<MaintenanceRequestList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete request');
    fireEvent.click(deleteButtons[0]);

    const deleteConfirmButton = screen.getByText('Delete');
    fireEvent.click(deleteConfirmButton);

    await waitFor(() => {
      expect(screen.getByText('Maintenance request deleted successfully')).toBeInTheDocument();
    });
  });

  it('shows error snackbar when delete fails', async () => {
    (dashboardService.deleteMaintenanceRequest as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    render(<MaintenanceRequestList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete request');
    fireEvent.click(deleteButtons[0]);

    const deleteConfirmButton = screen.getByText('Delete');
    fireEvent.click(deleteConfirmButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete maintenance request')).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    render(<MaintenanceRequestList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    });

    const pagination = screen.getByLabelText('Maintenance requests pagination');
    fireEvent.click(pagination);

    expect(pagination).toBeInTheDocument();
  });
});