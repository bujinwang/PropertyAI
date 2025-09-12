import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoleForm from './RoleForm';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    createRole: jest.fn(),
    updateRole: jest.fn(),
    getPermissions: jest.fn(),
  },
}));

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;

describe('RoleForm', () => {
  const mockPermissions = [
    { id: '1', name: 'users:create', description: 'Create users', resource: 'users', action: 'create', createdAt: '', updatedAt: '' },
    { id: '2', name: 'users:read', description: 'Read users', resource: 'users', action: 'read', createdAt: '', updatedAt: '' },
  ];

  const mockRole = {
    id: '1',
    name: 'Test Role',
    description: 'Test description',
    permissions: ['users:create'],
    level: 3,
    customPermissions: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDashboardService.getPermissions.mockResolvedValue(mockPermissions);
  });

  it('renders create form correctly', () => {
    render(<RoleForm open onClose={() => {}} />);

    expect(screen.getByText('Create New Role')).toBeInTheDocument();
    expect(screen.getByLabelText(/role name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role level/i)).toBeInTheDocument();
  });

  it('renders edit form with initial values', () => {
    render(
      <RoleForm
        open
        onClose={() => {}}
        isEdit
        initialValues={mockRole}
      />
    );

    expect(screen.getByText('Edit Role')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Role')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<RoleForm open onClose={() => {}} />);

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
  });

  it('submits create form successfully', async () => {
    const mockOnSubmitSuccess = jest.fn();
    mockDashboardService.createRole.mockResolvedValue(mockRole);

    render(
      <RoleForm
        open
        onClose={() => {}}
        onSubmitSuccess={mockOnSubmitSuccess}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/role name/i), { target: { value: 'New Role' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'New description' } });

    // Select permissions
    const permissionSelect = screen.getByLabelText(/permissions/i);
    fireEvent.mouseDown(permissionSelect);
    const createOption = screen.getByText('users: Create');
    fireEvent.click(createOption);

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockDashboardService.createRole).toHaveBeenCalledWith({
        name: 'New Role',
        description: 'New description',
        level: 4, // Default level
        permissions: ['users:create'],
        customPermissions: false,
      });
      expect(mockOnSubmitSuccess).toHaveBeenCalled();
    });
  });

  it('submits edit form successfully', async () => {
    const mockOnSubmitSuccess = jest.fn();
    mockDashboardService.updateRole.mockResolvedValue(mockRole);

    render(
      <RoleForm
        open
        onClose={() => {}}
        onSubmitSuccess={mockOnSubmitSuccess}
        isEdit
        roleId="1"
        initialValues={mockRole}
      />
    );

    // Change name
    fireEvent.change(screen.getByDisplayValue('Test Role'), { target: { value: 'Updated Role' } });

    const submitButton = screen.getByText('Update');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockDashboardService.updateRole).toHaveBeenCalledWith('1', {
        name: 'Updated Role',
        description: 'Test description',
        level: 3,
        permissions: ['users:create'],
        customPermissions: false,
      });
      expect(mockOnSubmitSuccess).toHaveBeenCalled();
    });
  });

  it('handles permission selection', async () => {
    render(<RoleForm open onClose={() => {}} />);

    const permissionSelect = screen.getByLabelText(/permissions/i);
    fireEvent.mouseDown(permissionSelect);

    await waitFor(() => {
      expect(screen.getByText('users: Create')).toBeInTheDocument();
      expect(screen.getByText('users: Read')).toBeInTheDocument();
    });

    const createOption = screen.getByText('users: Create');
    fireEvent.click(createOption);

    // Close dropdown
    fireEvent.keyDown(permissionSelect, { key: 'Escape' });

    expect(screen.getByText('users-create (1)')).toBeInTheDocument();
  });

  it('handles custom permissions toggle', () => {
    render(<RoleForm open onClose={() => {}} />);

    const customPermissionsSwitch = screen.getByLabelText(/allow custom permissions/i);
    fireEvent.click(customPermissionsSwitch);

    expect(customPermissionsSwitch).toBeChecked();
  });

  it('removes selected permissions', async () => {
    render(
      <RoleForm
        open
        onClose={() => {}}
        initialValues={{ permissions: ['users:create', 'users:read'] }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('users-create')).toBeInTheDocument();
    });

    const removeButton = screen.getAllByTestId('CancelIcon')[0]; // Chip delete icon
    fireEvent.click(removeButton);

    expect(screen.queryByText('users-create')).not.toBeInTheDocument();
  });

  it('handles API errors', async () => {
    mockDashboardService.createRole.mockRejectedValue(new Error('API Error'));

    render(<RoleForm open onClose={() => {}} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/role name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test' } });

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel is clicked', () => {
    const mockOnClose = jest.fn();
    render(<RoleForm open onClose={mockOnClose} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('loads permissions on mount', () => {
    render(<RoleForm open onClose={() => {}} />);

    expect(mockDashboardService.getPermissions).toHaveBeenCalled();
  });
});