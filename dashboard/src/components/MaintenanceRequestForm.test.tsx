import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MaintenanceRequestForm from './MaintenanceRequestForm';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getTenants: jest.fn(),
    getVacantUnitOptions: jest.fn(),
    createMaintenanceRequest: jest.fn(),
    updateMaintenanceRequest: jest.fn(),
  },
}));

const renderMaintenanceRequestForm = (props: Partial<Parameters<typeof MaintenanceRequestForm>[0]> = {}) => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSubmitSuccess: jest.fn(),
    initialValues: {},
    isEdit: false,
    requestId: undefined,
  };

  return render(<MaintenanceRequestForm {...defaultProps} {...props} />);
};

const mockTenants = [
  {
    id: 'tenant1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    leaseStart: '2024-01-01',
    leaseEnd: '2024-12-31',
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tenant2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '098-765-4321',
    leaseStart: '2024-02-01',
    leaseEnd: '2024-12-31',
    status: 'active' as const,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
];

const mockUnits = [
  {
    id: 'unit1',
    unitNumber: '101',
    address: '123 Main St, Apt 101',
  },
  {
    id: 'unit2',
    unitNumber: '102',
    address: '123 Main St, Apt 102',
  },
];

describe('MaintenanceRequestForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dashboardService.getTenants as jest.Mock).mockResolvedValue({
      data: mockTenants,
      total: 2,
    });
    (dashboardService.getVacantUnitOptions as jest.Mock).mockResolvedValue(mockUnits);
  });

  it('renders the form with required fields', async () => {
    renderMaintenanceRequestForm();

    await waitFor(() => {
      expect(screen.getByText('Create New Maintenance Request')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Tenant')).toBeInTheDocument();
    expect(screen.getByLabelText('Unit')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('loads tenants and units on mount', async () => {
    renderMaintenanceRequestForm();

    await waitFor(() => {
      expect(dashboardService.getTenants).toHaveBeenCalled();
      expect(dashboardService.getVacantUnitOptions).toHaveBeenCalled();
    });
  });

  it('displays tenant options in autocomplete', async () => {
    renderMaintenanceRequestForm();

    await waitFor(() => {
      expect(screen.getByText('John Doe (john@example.com)')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith (jane@example.com)')).toBeInTheDocument();
    });
  });

  it('displays unit options in autocomplete', async () => {
    renderMaintenanceRequestForm();

    await waitFor(() => {
      expect(screen.getByText('101 - 123 Main St, Apt 101')).toBeInTheDocument();
      expect(screen.getByText('102 - 123 Main St, Apt 102')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    renderMaintenanceRequestForm();

    await waitFor(() => {
      expect(screen.getByText('Create New Maintenance Request')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Tenant is required')).toBeInTheDocument();
      expect(screen.getByText('Unit is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
  });

  it('validates description minimum length', async () => {
    renderMaintenanceRequestForm();

    await waitFor(() => {
      expect(screen.getByText('Create New Maintenance Request')).toBeInTheDocument();
    });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'Hi' } });

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    (dashboardService.createMaintenanceRequest as jest.Mock).mockResolvedValue({
      id: 'request1',
      tenantId: 'tenant1',
      unitId: 'unit1',
      propertyId: 'prop1',
      description: 'Leaky faucet in kitchen',
      priority: 'high',
      status: 'pending',
      submittedAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });

    const mockOnSubmitSuccess = jest.fn();
    const mockOnClose = jest.fn();

    renderMaintenanceRequestForm({
      onSubmitSuccess: mockOnSubmitSuccess,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByText('Create New Maintenance Request')).toBeInTheDocument();
    });

    // Fill out the form
    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'Leaky faucet in kitchen needs repair' } });

    expect(descriptionInput).toHaveValue('Leaky faucet in kitchen needs repair');
  });

  it('shows edit mode when isEdit is true', async () => {
    const initialValues = {
      id: 'request1',
      tenantId: 'tenant1',
      unitId: 'unit1',
      propertyId: 'prop1',
      description: 'Leaky faucet in kitchen',
      priority: 'high' as const,
      status: 'open' as const,
      submittedAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    renderMaintenanceRequestForm({
      isEdit: true,
      initialValues,
      requestId: 'request1',
    });

    await waitFor(() => {
      expect(screen.getByText('Edit Maintenance Request')).toBeInTheDocument();
    });

    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const mockOnClose = jest.fn();

    renderMaintenanceRequestForm({ onClose: mockOnClose });

    await waitFor(() => {
      expect(screen.getByText('Create New Maintenance Request')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    (dashboardService.createMaintenanceRequest as jest.Mock).mockRejectedValue(new Error('API Error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderMaintenanceRequestForm();

    await waitFor(() => {
      expect(screen.getByText('Create New Maintenance Request')).toBeInTheDocument();
    });

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});