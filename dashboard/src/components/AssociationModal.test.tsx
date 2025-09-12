import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AssociationModal from './AssociationModal';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getAvailableTenants: jest.fn(),
    getVacantUnitOptions: jest.fn(),
    associateLeaseToTenantUnit: jest.fn(),
    renewLease: jest.fn(),
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
      {component}
    </QueryClientProvider>
  );
};

describe('AssociationModal', () => {
  const mockOnSubmit = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    leaseId: 'lease-1',
    mode: 'associate' as const,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDashboardService.getAvailableTenants.mockResolvedValue([
      {
        id: 'tenant-1',
        name: 'John Doe',
        email: 'john@example.com',
        leaseStart: '2024-01-01',
        leaseEnd: undefined,
        status: 'active' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        unitId: undefined,
        phone: undefined,
      },
      {
        id: 'tenant-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        leaseStart: '2024-01-01',
        leaseEnd: undefined,
        status: 'active' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        unitId: undefined,
        phone: undefined,
      },
    ]);
    mockDashboardService.getVacantUnitOptions.mockResolvedValue([
      { id: 'unit-1', unitNumber: '101', address: '123 Main St' },
      { id: 'unit-2', unitNumber: '102', address: '123 Main St' },
    ]);
  });

  it('renders associate mode correctly', async () => {
    renderWithProviders(<AssociationModal {...defaultProps} />);

    expect(screen.getByText('Associate Lease to Tenant & Unit')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Available Tenant')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Vacant Unit')).toBeInTheDocument();
    expect(screen.getByText('Associate')).toBeInTheDocument();
  });

  it('renders renew mode correctly', () => {
    renderWithProviders(
      <AssociationModal {...defaultProps} mode="renew" />
    );

    expect(screen.getByText('Renew Lease')).toBeInTheDocument();
    expect(screen.getByLabelText('New End Date')).toBeInTheDocument();
    expect(screen.getByText('Renew')).toBeInTheDocument();
  });

  it('loads tenants and units on open', async () => {
    renderWithProviders(<AssociationModal {...defaultProps} />);

    await waitFor(() => {
      expect(mockDashboardService.getAvailableTenants).toHaveBeenCalled();
      expect(mockDashboardService.getVacantUnitOptions).toHaveBeenCalled();
    });
  });

  it('calls onSubmit with correct data on associate', async () => {
    mockDashboardService.associateLeaseToTenantUnit.mockResolvedValue({} as any);

    renderWithProviders(<AssociationModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Available Tenant')).toBeInTheDocument();
    });

    // Select tenant
    const tenantSelect = screen.getByLabelText('Select Available Tenant');
    fireEvent.mouseDown(tenantSelect);
    const tenantOption = screen.getByText('John Doe (john@example.com)');
    fireEvent.click(tenantOption);

    // Select unit
    const unitSelect = screen.getByLabelText('Select Vacant Unit');
    fireEvent.mouseDown(unitSelect);
    const unitOption = screen.getByText('101 - 123 Main St');
    fireEvent.click(unitOption);

    // Submit
    const submitButton = screen.getByText('Associate');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockDashboardService.associateLeaseToTenantUnit).toHaveBeenCalledWith(
        'lease-1',
        'tenant-1',
        'unit-1'
      );
      expect(mockOnSubmit).toHaveBeenCalledWith({
        mode: 'associate',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
      });
    });
  });

  it('shows confirmation dialog for renewal', async () => {
    mockDashboardService.renewLease.mockResolvedValue({} as any);

    renderWithProviders(<AssociationModal {...defaultProps} mode="renew" />);

    // Set new end date
    const dateInput = screen.getByLabelText('New End Date');
    fireEvent.change(dateInput, { target: { value: '2024-12-31' } });

    // Submit
    const submitButton = screen.getByText('Renew');
    fireEvent.click(submitButton);

    // Check confirmation dialog appears
    expect(screen.getByText('Confirm Lease Renewal')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to renew this lease?')).toBeInTheDocument();

    // Confirm
    const confirmButton = screen.getByText('Confirm Renewal');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDashboardService.renewLease).toHaveBeenCalledWith('lease-1', '2024-12-31');
      expect(mockOnSubmit).toHaveBeenCalledWith({
        mode: 'renew',
        newEndDate: expect.any(Date),
      });
    });
  });

  it('calls onClose when cancel is clicked', () => {
    renderWithProviders(<AssociationModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    renderWithProviders(<AssociationModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Associate')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Associate');
    fireEvent.click(submitButton);

    // Should still be open due to validation
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});