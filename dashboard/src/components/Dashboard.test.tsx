import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import theme from '../design-system/theme';
import Dashboard from '../pages/Dashboard';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    getVacantUnits: jest.fn(),
    getMaintenanceRequests: jest.fn(),
    getOverduePayments: jest.fn(),
  },
}));

const mockGetVacantUnits = dashboardService.getVacantUnits as jest.MockedFunction<typeof dashboardService.getVacantUnits>;
const mockGetMaintenanceRequests = dashboardService.getMaintenanceRequests as jest.MockedFunction<typeof dashboardService.getMaintenanceRequests>;
const mockGetOverduePayments = dashboardService.getOverduePayments as jest.MockedFunction<typeof dashboardService.getOverduePayments>;

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
        <MemoryRouter>
          {component}
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Dashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main dashboard title', () => {
    mockGetVacantUnits.mockResolvedValue([]);
    mockGetMaintenanceRequests.mockResolvedValue({ data: [], total: 0 });
    mockGetOverduePayments.mockResolvedValue([]);

    renderWithProviders(<Dashboard />);

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders all three dashboard components', async () => {
    mockGetVacantUnits.mockResolvedValue([
      {
        id: '1',
        propertyId: 'p1',
        unitNumber: '101',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        size: 800,
        bedrooms: 2,
        bathrooms: 1,
        rent: 1500,
        availableDate: '2024-01-01',
      },
    ]);
    mockGetMaintenanceRequests.mockResolvedValue({
      data: [
        {
          id: '1',
          tenantId: 't1',
          unitId: 'u1',
          propertyId: 'p1',
          title: 'Fix leaky faucet',
          description: 'Kitchen faucet is leaking',
          status: 'open',
          priority: 'medium',
          submittedAt: '2024-01-01',
          updatedAt: '2024-01-01',
          tenantName: 'John Doe',
        },
      ],
      total: 1
    });
    mockGetOverduePayments.mockResolvedValue([
      {
        id: '1',
        tenantId: 't1',
        tenantName: 'John Doe',
        unitNumber: '101',
        propertyId: 'p1',
        amount: 1500,
        dueDate: '2024-01-01',
        daysOverdue: 5,
        paymentMethod: 'Bank Transfer',
      },
    ]);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      // Check for Vacant Units Summary
      expect(screen.getByText('Vacant Units Summary')).toBeInTheDocument();
      expect(screen.getByText('1 units available')).toBeInTheDocument();
      expect(screen.getByText('Unit 101')).toBeInTheDocument();

      // Check for Maintenance Requests List
      expect(screen.getByText('Recent Maintenance Requests')).toBeInTheDocument();
      expect(screen.getByText('1 requests')).toBeInTheDocument();
      expect(screen.getByText('Fix leaky faucet')).toBeInTheDocument();

      // Check for Overdue Payments Alerts
      expect(screen.getByText('Overdue Payments Alerts')).toBeInTheDocument();
      expect(screen.getByText('1 alerts')).toBeInTheDocument();
      expect(screen.getByText('Unit 101: John Doe')).toBeInTheDocument();
    });
  });

  it('handles loading states for all components', () => {
    // Return promises that never resolve to simulate loading
    mockGetVacantUnits.mockReturnValue(new Promise(() => {}));
    mockGetMaintenanceRequests.mockReturnValue(new Promise(() => {}));
    mockGetOverduePayments.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<Dashboard />);

    // Should show loading states (no content yet)
    expect(screen.queryByText('Vacant Units Summary')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent Maintenance Requests')).not.toBeInTheDocument();
    expect(screen.queryByText('Overdue Payments Alerts')).not.toBeInTheDocument();
  });

  it('handles error states for all components', async () => {
    const error = new Error('API error');
    mockGetVacantUnits.mockRejectedValue(error);
    mockGetMaintenanceRequests.mockRejectedValue(error);
    mockGetOverduePayments.mockRejectedValue(error);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      // Check for error messages in each component
      expect(screen.getByText(/Failed to load vacant units/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load maintenance requests/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load overdue payments/)).toBeInTheDocument();
    });
  });

  it('handles empty states for all components', async () => {
    mockGetVacantUnits.mockResolvedValue([]);
    mockGetMaintenanceRequests.mockResolvedValue({ data: [], total: 0 });
    mockGetOverduePayments.mockResolvedValue([]);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      // Check for empty state messages
      expect(screen.getByText('No vacant units')).toBeInTheDocument();
      expect(screen.getByText('No maintenance requests')).toBeInTheDocument();
      expect(screen.getByText('No overdue payments')).toBeInTheDocument();
    });
  });

  it('maintains responsive grid layout', () => {
    mockGetVacantUnits.mockResolvedValue([]);
    mockGetMaintenanceRequests.mockResolvedValue({ data: [], total: 0 });
    mockGetOverduePayments.mockResolvedValue([]);

    renderWithProviders(<Dashboard />);

    // Check that all components are rendered in grid items
    const gridItems = screen.getAllByRole('gridcell');
    expect(gridItems).toHaveLength(3); // Three components in grid
  });
});