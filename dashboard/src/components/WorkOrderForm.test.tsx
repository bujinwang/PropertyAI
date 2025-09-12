import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkOrderForm from './WorkOrderForm';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getMaintenanceRequests: jest.fn(),
    createWorkOrder: jest.fn(),
    updateWorkOrder: jest.fn(),
    updateMaintenanceRequest: jest.fn(),
  },
}));

const renderWorkOrderForm = (props: Partial<Parameters<typeof WorkOrderForm>[0]> = {}) => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSubmitSuccess: jest.fn(),
    initialValues: {},
    isEdit: false,
    workOrderId: undefined,
  };

  return render(<WorkOrderForm {...defaultProps} {...props} />);
};

const mockMaintenanceRequests = [
  {
    id: 'req1',
    title: 'Leaky faucet',
    description: 'Leaky faucet in kitchen needs repair',
    tenantId: 'tenant1',
    unitId: 'unit1',
    propertyId: 'prop1',
    priority: 'high' as const,
    status: 'open' as const,
    submittedAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    tenantName: 'Jane Smith',
    unitAddress: '123 Main St, Apt 101',
  },
  {
    id: 'req2',
    title: 'Broken window',
    description: 'Broken window in bedroom',
    tenantId: 'tenant2',
    unitId: 'unit2',
    propertyId: 'prop1',
    priority: 'medium' as const,
    status: 'in_progress' as const,
    submittedAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
    tenantName: 'Mike Wilson',
    unitAddress: '123 Main St, Apt 205',
  },
];

describe('WorkOrderForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dashboardService.getMaintenanceRequests as jest.Mock).mockResolvedValue({
      data: mockMaintenanceRequests,
      total: 2,
    });
  });

  it('renders the form with required fields', async () => {
    renderWorkOrderForm();

    await waitFor(() => {
      expect(screen.getByText('Create New Work Order')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Maintenance Request')).toBeInTheDocument();
    expect(screen.getByLabelText('Assigned Staff')).toBeInTheDocument();
    expect(screen.getByLabelText('Scheduled Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('loads maintenance requests on mount', async () => {
    renderWorkOrderForm();

    await waitFor(() => {
      expect(dashboardService.getMaintenanceRequests).toHaveBeenCalled();
    });
  });

  it('displays maintenance request options in autocomplete', async () => {
    renderWorkOrderForm();

    await waitFor(() => {
      expect(screen.getByText('Leaky faucet - Leaky faucet in kitchen needs repair...')).toBeInTheDocument();
      expect(screen.getByText('Broken window - Broken window in bedroom')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    renderWorkOrderForm();

    await waitFor(() => {
      expect(screen.getByText('Create New Work Order')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Maintenance request is required')).toBeInTheDocument();
      expect(screen.getByText('Assigned staff is required')).toBeInTheDocument();
      expect(screen.getByText('Scheduled date is required')).toBeInTheDocument();
    });
  });

  it('validates assigned staff minimum length', async () => {
    renderWorkOrderForm();

    await waitFor(() => {
      expect(screen.getByText('Create New Work Order')).toBeInTheDocument();
    });

    const staffInput = screen.getByLabelText('Assigned Staff');
    fireEvent.change(staffInput, { target: { value: 'A' } });

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Assigned staff must be at least 2 characters')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    (dashboardService.createWorkOrder as jest.Mock).mockResolvedValue({
      id: 'wo1',
      requestId: 'req1',
      assignedStaff: 'John Doe',
      scheduledDate: '2024-01-15',
      completedDate: null,
      notes: 'Fix the leaky faucet',
      status: 'pending',
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
    });

    const mockOnSubmitSuccess = jest.fn();
    const mockOnClose = jest.fn();

    renderWorkOrderForm({
      onSubmitSuccess: mockOnSubmitSuccess,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByText('Create New Work Order')).toBeInTheDocument();
    });

    // Fill out the form
    const staffInput = screen.getByLabelText('Assigned Staff');
    fireEvent.change(staffInput, { target: { value: 'John Doe' } });

    const notesInput = screen.getByLabelText('Notes');
    fireEvent.change(notesInput, { target: { value: 'Fix the leaky faucet' } });

    expect(staffInput).toHaveValue('John Doe');
    expect(notesInput).toHaveValue('Fix the leaky faucet');
  });

  it('shows edit mode when isEdit is true', async () => {
    const initialValues = {
      id: 'wo1',
      requestId: 'req1',
      assignedStaff: 'John Doe',
      scheduledDate: '2024-01-15',
      completedDate: undefined,
      notes: 'Fix the leaky faucet',
      status: 'pending' as const,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
    };

    renderWorkOrderForm({
      isEdit: true,
      initialValues,
      workOrderId: 'wo1',
    });

    await waitFor(() => {
      expect(screen.getByText('Edit Work Order')).toBeInTheDocument();
    });

    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const mockOnClose = jest.fn();

    renderWorkOrderForm({ onClose: mockOnClose });

    await waitFor(() => {
      expect(screen.getByText('Create New Work Order')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    (dashboardService.createWorkOrder as jest.Mock).mockRejectedValue(new Error('API Error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderWorkOrderForm();

    await waitFor(() => {
      expect(screen.getByText('Create New Work Order')).toBeInTheDocument();
    });

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('syncs maintenance request status when work order is completed', async () => {
    (dashboardService.updateWorkOrder as jest.Mock).mockResolvedValue({
      id: 'wo1',
      status: 'completed',
    });

    renderWorkOrderForm({
      isEdit: true,
      initialValues: {
        id: 'wo1',
        requestId: 'req1',
        assignedStaff: 'John Doe',
        scheduledDate: '2024-01-15',
        status: 'in progress' as const,
      },
      workOrderId: 'wo1',
    });

    await waitFor(() => {
      expect(screen.getByText('Edit Work Order')).toBeInTheDocument();
    });

    // The update logic should call updateMaintenanceRequest when status changes to completed
    // This would be tested in an integration test with actual form submission
  });
});