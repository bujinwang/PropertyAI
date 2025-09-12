import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserList from './UserList';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getUsers: jest.fn(),
    getRoles: jest.fn(),
  },
}));

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('UserList', () => {
  const mockUsers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      roleId: 'admin-role',
      status: 'active' as const,
      lastLogin: '2024-01-15T10:00:00Z',
      phone: '+1234567890',
      preferences: {
        theme: 'light' as const,
        notifications: { email: true, inApp: true, sms: false },
        language: 'en',
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      roleName: 'Admin',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      roleId: 'manager-role',
      status: 'inactive' as const,
      lastLogin: undefined,
      phone: undefined,
      preferences: {
        theme: 'dark' as const,
        notifications: { email: false, inApp: true, sms: true },
        language: 'es',
      },
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      roleName: 'Manager',
    },
  ];

  const mockRoles = [
    { id: 'admin-role', name: 'Admin', level: 4, permissions: [], description: '', customPermissions: false, createdAt: '', updatedAt: '' },
    { id: 'manager-role', name: 'Manager', level: 3, permissions: [], description: '', customPermissions: false, createdAt: '', updatedAt: '' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDashboardService.getUsers.mockResolvedValue({
      data: mockUsers,
      total: 2,
    });
    mockDashboardService.getRoles.mockResolvedValue({
      data: mockRoles,
      total: 2,
    });
  });

  it('renders user list correctly', async () => {
    renderWithProviders(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('displays user status correctly', async () => {
    renderWithProviders(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('inactive')).toBeInTheDocument();
    });
  });

  it('shows last login information', async () => {
    renderWithProviders(<UserList />);

    await waitFor(() => {
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
      expect(screen.getByText('Never')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    renderWithProviders(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/search users/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(mockDashboardService.getUsers).toHaveBeenCalledWith(1, 10, { search: 'John' });
    });
  });

  it('handles status filter', async () => {
    renderWithProviders(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    const activeOption = screen.getByText('Active');
    fireEvent.click(activeOption);

    await waitFor(() => {
      expect(mockDashboardService.getUsers).toHaveBeenCalledWith(1, 10, { status: 'active' });
    });
  });

  it('handles role filter', async () => {
    renderWithProviders(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const roleSelect = screen.getByLabelText('Role');
    fireEvent.mouseDown(roleSelect);
    const adminOption = screen.getByText('Admin');
    fireEvent.click(adminOption);

    await waitFor(() => {
      expect(mockDashboardService.getUsers).toHaveBeenCalledWith(1, 10, { roleId: 'admin-role' });
    });
  });

  it('handles pagination', async () => {
    mockDashboardService.getUsers.mockResolvedValue({
      data: Array(15).fill(mockUsers[0]).map((user, index) => ({ ...user, id: `${index}` })),
      total: 25,
    });

    renderWithProviders(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    const pagination = screen.getByRole('navigation', { name: /users pagination/i });
    expect(pagination).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const mockOnEdit = jest.fn();
    renderWithProviders(<UserList onEdit={mockOnEdit} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByLabelText(/edit user/i);
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('calls onCreate when create button is clicked', async () => {
    const mockOnCreate = jest.fn();
    renderWithProviders(<UserList onCreate={mockOnCreate} />);

    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add User');
    fireEvent.click(addButton);

    expect(mockOnCreate).toHaveBeenCalled();
  });

  it('handles bulk status change', async () => {
    const mockOnBulkStatusChange = jest.fn();
    renderWithProviders(
      <UserList selectable onBulkStatusChange={mockOnBulkStatusChange} />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select users
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Select first user
    fireEvent.click(checkboxes[2]); // Select second user

    // Change status to inactive
    const statusButton = screen.getByText('Deactivate');
    fireEvent.click(statusButton);

    expect(mockOnBulkStatusChange).toHaveBeenCalledWith(['1', '2'], 'inactive');
  });

  it('handles bulk role change', async () => {
    const mockOnBulkRoleChange = jest.fn();
    renderWithProviders(
      <UserList selectable onBulkRoleChange={mockOnBulkRoleChange} />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select users
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    // Change role
    const roleSelect = screen.getByLabelText('Change Role');
    fireEvent.mouseDown(roleSelect);
    const managerOption = screen.getByText('Manager');
    fireEvent.click(managerOption);

    expect(mockOnBulkRoleChange).toHaveBeenCalledWith(['1'], 'manager-role');
  });

  it('handles bulk delete', async () => {
    const mockOnBulkDelete = jest.fn();
    renderWithProviders(
      <UserList selectable onBulkDelete={mockOnBulkDelete} />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select all users
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    fireEvent.click(selectAllCheckbox);

    // Click delete selected
    const deleteButton = screen.getByText('Delete Selected');
    fireEvent.click(deleteButton);

    expect(mockOnBulkDelete).toHaveBeenCalledWith(['1', '2']);
  });

  it('shows loading state', () => {
    mockDashboardService.getUsers.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<UserList />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    mockDashboardService.getUsers.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
    });
  });

  it('shows empty state when no users', async () => {
    mockDashboardService.getUsers.mockResolvedValue({
      data: [],
      total: 0,
    });

    renderWithProviders(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });
});