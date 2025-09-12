import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RoleList from './RoleList';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
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

describe('RoleList', () => {
  const mockRoles = [
    {
      id: '1',
      name: 'Admin',
      description: 'Administrator role',
      permissions: ['users:create', 'users:read'],
      level: 4,
      customPermissions: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Manager',
      description: 'Manager role',
      permissions: ['properties:read', 'tenants:read'],
      level: 3,
      customPermissions: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDashboardService.getRoles.mockResolvedValue({
      data: mockRoles,
      total: 2,
    });
  });

  it('renders role list correctly', async () => {
    renderWithProviders(<RoleList />);

    await waitFor(() => {
      expect(screen.getByText('Roles')).toBeInTheDocument();
    });

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Administrator role')).toBeInTheDocument();
  });

  it('displays role levels correctly', async () => {
    renderWithProviders(<RoleList />);

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    // Check for role level chips
    const adminChip = screen.getAllByText('Admin')[1]; // First is role name, second is level
    const managerChip = screen.getByText('Manager');

    expect(adminChip).toBeInTheDocument();
    expect(managerChip).toBeInTheDocument();
  });

  it('shows permission count', async () => {
    renderWithProviders(<RoleList />);

    await waitFor(() => {
      expect(screen.getByText('2 permissions')).toBeInTheDocument();
      expect(screen.getByText('2 permissions')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    renderWithProviders(<RoleList />);

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/search roles/i);
    fireEvent.change(searchInput, { target: { value: 'Admin' } });

    await waitFor(() => {
      expect(mockDashboardService.getRoles).toHaveBeenCalledWith(1, 10, { search: 'Admin' });
    });
  });

  it('handles pagination', async () => {
    mockDashboardService.getRoles.mockResolvedValue({
      data: Array(15).fill(mockRoles[0]).map((role, index) => ({ ...role, id: `${index}` })),
      total: 25,
    });

    renderWithProviders(<RoleList />);

    await waitFor(() => {
      expect(screen.getByText('Roles')).toBeInTheDocument();
    });

    // Should show pagination for more than 10 items
    const pagination = screen.getByRole('navigation', { name: /roles pagination/i });
    expect(pagination).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const mockOnEdit = jest.fn();
    renderWithProviders(<RoleList onEdit={mockOnEdit} />);

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByLabelText(/edit role/i);
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockRoles[0]);
  });

  it('calls onCreate when create button is clicked', async () => {
    const mockOnCreate = jest.fn();
    renderWithProviders(<RoleList onCreate={mockOnCreate} />);

    await waitFor(() => {
      expect(screen.getByText('Add Role')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Role');
    fireEvent.click(addButton);

    expect(mockOnCreate).toHaveBeenCalled();
  });

  it('handles bulk operations when selectable', async () => {
    const mockOnBulkDelete = jest.fn();
    renderWithProviders(
      <RoleList selectable onBulkDelete={mockOnBulkDelete} />
    );

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    // Select all roles
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    fireEvent.click(selectAllCheckbox);

    // Click delete selected
    const deleteButton = screen.getByText('Delete Selected');
    fireEvent.click(deleteButton);

    expect(mockOnBulkDelete).toHaveBeenCalledWith(['1', '2']);
  });

  it('shows loading state', () => {
    mockDashboardService.getRoles.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<RoleList />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    mockDashboardService.getRoles.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<RoleList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch roles')).toBeInTheDocument();
    });
  });

  it('shows empty state when no roles', async () => {
    mockDashboardService.getRoles.mockResolvedValue({
      data: [],
      total: 0,
    });

    renderWithProviders(<RoleList />);

    await waitFor(() => {
      expect(screen.getByText('No roles found')).toBeInTheDocument();
    });
  });
});