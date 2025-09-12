import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../design-system/theme';
import MaintenanceRequestsList from './MaintenanceRequestsList';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    getMaintenanceRequests: jest.fn(),
  },
}));

const mockGetMaintenanceRequests = dashboardService.getMaintenanceRequests as jest.MockedFunction<typeof dashboardService.getMaintenanceRequests>;

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('MaintenanceRequestsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state with Skeleton', () => {
    mockGetMaintenanceRequests.mockReturnValue(new Promise(() => {})); // Simulate loading

    renderWithProviders(<MaintenanceRequestsList />);

    expect(screen.queryByText('Recent Maintenance Requests')).not.toBeInTheDocument();
    expect(screen.queryByText('No maintenance requests')).not.toBeInTheDocument();
  });

  it('renders error state with Alert', async () => {
    const error = new Error('API error');
    mockGetMaintenanceRequests.mockRejectedValue(error);

    renderWithProviders(<MaintenanceRequestsList />);

    await waitFor(() => {
      expect(screen.getByText('Recent Maintenance Requests')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load maintenance requests: API error/)).toBeInTheDocument();
    });
  });

  it('renders empty state when no maintenance requests', async () => {
    mockGetMaintenanceRequests.mockResolvedValue([]);

    renderWithProviders(<MaintenanceRequestsList />);

    await waitFor(() => {
      expect(screen.getByText('Recent Maintenance Requests')).toBeInTheDocument();
      expect(screen.getByText('No maintenance requests')).toBeInTheDocument();
      expect(screen.getByText('0 requests')).toBeInTheDocument();
    });
  });

  it('renders with data: count, list items, status icons, action buttons', async () => {
    const mockRequests = [
      {
        id: '1',
        unitId: 'u1',
        title: 'Fix leaky faucet',
        description: 'Kitchen faucet is leaking',
        status: 'open' as const,
        priority: 'medium' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        tenantName: 'John Doe',
      },
      {
        id: '2',
        unitId: 'u2',
        title: 'Broken window',
        description: 'Window in living room is broken',
        status: 'in_progress' as const,
        priority: 'high' as const,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
        tenantName: 'Jane Smith',
      },
    ];
    mockGetMaintenanceRequests.mockResolvedValue(mockRequests);

    renderWithProviders(<MaintenanceRequestsList />);

    await waitFor(() => {
      expect(screen.getByText('Recent Maintenance Requests')).toBeInTheDocument();
      expect(screen.getByText('2 requests')).toBeInTheDocument();
      expect(screen.getByText('Fix leaky faucet')).toBeInTheDocument();
      expect(screen.getByText('Kitchen faucet is leaking')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Broken window')).toBeInTheDocument();
      expect(screen.getByText('Window in living room is broken')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      // Status chips
      expect(screen.getByText('open')).toBeInTheDocument();
      expect(screen.getByText('in progress')).toBeInTheDocument();
      // Priority chips
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      // Action buttons
      expect(screen.getAllByLabelText('View details')).toHaveLength(2);
      expect(screen.getAllByLabelText('Edit request')).toHaveLength(2);
    });
  });

  it('filters requests based on search term', async () => {
    const mockRequests = [
      {
        id: '1',
        unitId: 'u1',
        title: 'Fix leaky faucet',
        description: 'Kitchen faucet is leaking',
        status: 'open' as const,
        priority: 'medium' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        tenantName: 'John Doe',
      },
      {
        id: '2',
        unitId: 'u2',
        title: 'Broken window',
        description: 'Window in living room is broken',
        status: 'in_progress' as const,
        priority: 'high' as const,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
        tenantName: 'Jane Smith',
      },
    ];
    mockGetMaintenanceRequests.mockResolvedValue(mockRequests);

    renderWithProviders(<MaintenanceRequestsList />);

    await waitFor(() => {
      expect(screen.getByText('Fix leaky faucet')).toBeInTheDocument();
      expect(screen.getByText('Broken window')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search maintenance requests...');
    fireEvent.change(searchInput, { target: { value: 'faucet' } });

    expect(screen.getByText('Fix leaky faucet')).toBeInTheDocument();
    expect(screen.queryByText('Broken window')).not.toBeInTheDocument();
  });

  it('shows "View all" when more than 10 requests', async () => {
    const manyRequests = Array.from({ length: 11 }, (_, i) => ({
      id: i.toString(),
      unitId: `u${i}`,
      title: `Request ${i}`,
      description: `Description ${i}`,
      status: 'open' as const,
      priority: 'low' as const,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      tenantName: `Tenant ${i}`,
    }));
    mockGetMaintenanceRequests.mockResolvedValue(manyRequests);

    renderWithProviders(<MaintenanceRequestsList />);

    await waitFor(() => {
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('View all maintenance requests')).toBeInTheDocument();
      // Only 10 requests should be rendered
      expect(screen.getAllByText(/Request [0-9]/)).toHaveLength(10);
    });
  });

  it('calls handleViewDetails when view button is clicked', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const mockRequests = [
      {
        id: '1',
        unitId: 'u1',
        title: 'Fix leaky faucet',
        description: 'Kitchen faucet is leaking',
        status: 'open' as const,
        priority: 'medium' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        tenantName: 'John Doe',
      },
    ];
    mockGetMaintenanceRequests.mockResolvedValue(mockRequests);

    renderWithProviders(<MaintenanceRequestsList />);

    await waitFor(() => {
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);
      expect(consoleSpy).toHaveBeenCalledWith('View details for request:', '1');
    });

    consoleSpy.mockRestore();
  });

  it('calls handleEdit when edit button is clicked', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const mockRequests = [
      {
        id: '1',
        unitId: 'u1',
        title: 'Fix leaky faucet',
        description: 'Kitchen faucet is leaking',
        status: 'open' as const,
        priority: 'medium' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        tenantName: 'John Doe',
      },
    ];
    mockGetMaintenanceRequests.mockResolvedValue(mockRequests);

    renderWithProviders(<MaintenanceRequestsList />);

    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit request');
      fireEvent.click(editButton);
      expect(consoleSpy).toHaveBeenCalledWith('Edit request:', '1');
    });

    consoleSpy.mockRestore();
  });
});