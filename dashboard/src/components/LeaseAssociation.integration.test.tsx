import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import LeaseList from '../pages/LeaseList';
import AssociationModal from './AssociationModal';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getLeases: jest.fn(),
    associateLeaseToTenantUnit: jest.fn(),
    renewLease: jest.fn(),
    getAvailableTenants: jest.fn(),
    getVacantUnitOptions: jest.fn(),
  },
}));

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
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

describe('Lease Association Integration', () => {
  const mockLease = {
    id: 'lease-1',
    tenantId: '',
    unitId: '',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    rentAmount: 1500,
    paymentFrequency: 'monthly' as const,
    status: 'active' as const,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    tenantName: undefined,
    unitAddress: undefined,
  };

  const mockTenants = [
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
  ];

  const mockUnits = [
    { id: 'unit-1', unitNumber: '101', address: '123 Main St' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDashboardService.getLeases.mockResolvedValue({
      data: [mockLease],
      total: 1,
    });
    mockDashboardService.getAvailableTenants.mockResolvedValue(mockTenants);
    mockDashboardService.getVacantUnitOptions.mockResolvedValue(mockUnits);
    mockDashboardService.associateLeaseToTenantUnit.mockResolvedValue({
      ...mockLease,
      tenantId: 'tenant-1',
      unitId: 'unit-1',
      tenantName: 'John Doe',
      unitAddress: '123 Main St, Unit 101',
    });
  });

  it('should complete full association workflow from lease list', async () => {
    renderWithProviders(<LeaseList />);

    // Wait for lease list to load
    await waitFor(() => {
      expect(screen.getByText('Leases')).toBeInTheDocument();
    });

    // Click associate button
    const associateButton = screen.getByLabelText('Associate lease');
    fireEvent.click(associateButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Associate Lease to Tenant & Unit')).toBeInTheDocument();
    });

    // Select tenant
    const tenantSelect = screen.getByLabelText('Select Available Tenant');
    fireEvent.mouseDown(tenantSelect);
    const tenantOption = await screen.findByText('John Doe (john@example.com)');
    fireEvent.click(tenantOption);

    // Select unit
    const unitSelect = screen.getByLabelText('Select Vacant Unit');
    fireEvent.mouseDown(unitSelect);
    const unitOption = await screen.findByText('101 - 123 Main St');
    fireEvent.click(unitOption);

    // Submit association
    const submitButton = screen.getByText('Associate');
    fireEvent.click(submitButton);

    // Wait for API call
    await waitFor(() => {
      expect(mockDashboardService.associateLeaseToTenantUnit).toHaveBeenCalledWith(
        'lease-1',
        'tenant-1',
        'unit-1'
      );
    });

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Lease associated successfully')).toBeInTheDocument();
    });
  });

  it('should handle renewal workflow with confirmation', async () => {
    mockDashboardService.renewLease.mockResolvedValue({
      ...mockLease,
      endDate: '2025-12-31',
      status: 'renewed',
    });

    renderWithProviders(<LeaseList />);

    // Wait for lease list to load
    await waitFor(() => {
      expect(screen.getByText('Leases')).toBeInTheDocument();
    });

    // Click renew button
    const renewButton = screen.getByLabelText('Renew lease');
    fireEvent.click(renewButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Renew Lease')).toBeInTheDocument();
    });

    // Set new end date
    const dateInput = screen.getByLabelText('New End Date');
    fireEvent.change(dateInput, { target: { value: '2025-12-31' } });

    // Submit renewal
    const submitButton = screen.getByText('Renew');
    fireEvent.click(submitButton);

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Lease Renewal')).toBeInTheDocument();
    });

    // Confirm renewal
    const confirmButton = screen.getByText('Confirm Renewal');
    fireEvent.click(confirmButton);

    // Wait for API call
    await waitFor(() => {
      expect(mockDashboardService.renewLease).toHaveBeenCalledWith('lease-1', '2025-12-31');
    });

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Lease renewed successfully')).toBeInTheDocument();
    });
  });

  it('should refresh lease list after association', async () => {
    // First call returns original lease
    mockDashboardService.getLeases
      .mockResolvedValueOnce({
        data: [mockLease],
        total: 1,
      })
      // Second call after association should return updated lease
      .mockResolvedValueOnce({
        data: [{
          ...mockLease,
          tenantId: 'tenant-1',
          unitId: 'unit-1',
          tenantName: 'John Doe',
          unitAddress: '123 Main St, Unit 101',
        }],
        total: 1,
      });

    renderWithProviders(<LeaseList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Leases')).toBeInTheDocument();
    });

    // Click associate button
    const associateButton = screen.getByLabelText('Associate lease');
    fireEvent.click(associateButton);

    // Complete association process
    await waitFor(() => {
      expect(screen.getByText('Associate Lease to Tenant & Unit')).toBeInTheDocument();
    });

    const tenantSelect = screen.getByLabelText('Select Available Tenant');
    fireEvent.mouseDown(tenantSelect);
    const tenantOption = await screen.findByText('John Doe (john@example.com)');
    fireEvent.click(tenantOption);

    const unitSelect = screen.getByLabelText('Select Vacant Unit');
    fireEvent.mouseDown(unitSelect);
    const unitOption = await screen.findByText('101 - 123 Main St');
    fireEvent.click(unitOption);

    const submitButton = screen.getByText('Associate');
    fireEvent.click(submitButton);

    // Wait for data refresh
    await waitFor(() => {
      expect(mockDashboardService.getLeases).toHaveBeenCalledTimes(2);
    });

    // Verify updated data is displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});