import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../design-system/theme';
import OverdueAlerts from './OverdueAlerts';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    getOverduePayments: jest.fn(),
  },
}));

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
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('OverdueAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state with Skeleton', () => {
    mockGetOverduePayments.mockReturnValue(new Promise(() => {})); // Simulate loading

    renderWithProviders(<OverdueAlerts />);

    expect(screen.queryByText('Overdue Payments Alerts')).not.toBeInTheDocument();
    expect(screen.queryByText('No overdue payments')).not.toBeInTheDocument();
  });

  it('renders error state with Alert', async () => {
    const error = new Error('API error');
    mockGetOverduePayments.mockRejectedValue(error);

    renderWithProviders(<OverdueAlerts />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Payments Alerts')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load overdue payments: API error/)).toBeInTheDocument();
    });
  });

  it('renders empty state when no overdue payments', async () => {
    mockGetOverduePayments.mockResolvedValue([]);

    renderWithProviders(<OverdueAlerts />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Payments Alerts')).toBeInTheDocument();
      expect(screen.getByText('No overdue payments')).toBeInTheDocument();
      expect(screen.getByText('All tenants are current on their payments.')).toBeInTheDocument();
      expect(screen.getByText('0 alerts')).toBeInTheDocument();
    });
  });

  it('renders with data: count, alerts with tenant info, amounts, days overdue', async () => {
    const mockPayments = [
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
      {
        id: '2',
        tenantId: 't2',
        tenantName: 'Jane Smith',
        unitNumber: '102',
        propertyId: 'p1',
        amount: 1700,
        dueDate: '2024-01-01',
        daysOverdue: 15,
        paymentMethod: 'Credit Card',
      },
    ];
    mockGetOverduePayments.mockResolvedValue(mockPayments);

    renderWithProviders(<OverdueAlerts />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Payments Alerts')).toBeInTheDocument();
      expect(screen.getByText('2 alerts')).toBeInTheDocument();
      expect(screen.getByText('Unit 101: John Doe')).toBeInTheDocument();
      expect(screen.getByText('Rent payment of $1500 is 5 days overdue.')).toBeInTheDocument();
      expect(screen.getByText('Payment method: Bank Transfer')).toBeInTheDocument();
      expect(screen.getByText('Unit 102: Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Rent payment of $1700 is 15 days overdue.')).toBeInTheDocument();
      expect(screen.getByText('Payment method: Credit Card')).toBeInTheDocument();
    });
  });

  it('dismisses alert when dismiss button is clicked', async () => {
    const mockPayments = [
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
    ];
    mockGetOverduePayments.mockResolvedValue(mockPayments);

    renderWithProviders(<OverdueAlerts />);

    await waitFor(() => {
      expect(screen.getByText('Unit 101: John Doe')).toBeInTheDocument();
      expect(screen.getByText('1 alerts')).toBeInTheDocument();
    });

    const dismissButton = screen.getByLabelText('Dismiss alert');
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText('Unit 101: John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('0 alerts')).toBeInTheDocument();
      expect(screen.getByText('No overdue payments')).toBeInTheDocument();
    });
  });

  it('acknowledges payment when acknowledge button is clicked', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const mockPayments = [
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
    ];
    mockGetOverduePayments.mockResolvedValue(mockPayments);

    renderWithProviders(<OverdueAlerts />);

    await waitFor(() => {
      const acknowledgeButton = screen.getByLabelText('Acknowledge payment');
      fireEvent.click(acknowledgeButton);
      expect(consoleSpy).toHaveBeenCalledWith('Acknowledge payment:', '1');
    });

    consoleSpy.mockRestore();
  });

  it('shows correct severity based on days overdue', async () => {
    const mockPayments = [
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
      {
        id: '2',
        tenantId: 't2',
        tenantName: 'Jane Smith',
        unitNumber: '102',
        propertyId: 'p1',
        amount: 1700,
        dueDate: '2024-01-01',
        daysOverdue: 20,
        paymentMethod: 'Credit Card',
      },
      {
        id: '3',
        tenantId: 't3',
        tenantName: 'Bob Johnson',
        unitNumber: '103',
        propertyId: 'p1',
        amount: 1600,
        dueDate: '2024-01-01',
        daysOverdue: 35,
        paymentMethod: 'Cash',
      },
    ];
    mockGetOverduePayments.mockResolvedValue(mockPayments);

    renderWithProviders(<OverdueAlerts />);

    await waitFor(() => {
      // 5 days overdue should be info severity
      expect(screen.getByText('Rent payment of $1500 is 5 days overdue.')).toBeInTheDocument();
      // 20 days overdue should be warning severity
      expect(screen.getByText('Rent payment of $1700 is 20 days overdue.')).toBeInTheDocument();
      // 35 days overdue should be error severity
      expect(screen.getByText('Rent payment of $1600 is 35 days overdue.')).toBeInTheDocument();
    });
  });

  it('handles singular/plural for days overdue correctly', async () => {
    const mockPayments = [
      {
        id: '1',
        tenantId: 't1',
        tenantName: 'John Doe',
        unitNumber: '101',
        propertyId: 'p1',
        amount: 1500,
        dueDate: '2024-01-01',
        daysOverdue: 1,
        paymentMethod: 'Bank Transfer',
      },
      {
        id: '2',
        tenantId: 't2',
        tenantName: 'Jane Smith',
        unitNumber: '102',
        propertyId: 'p1',
        amount: 1700,
        dueDate: '2024-01-01',
        daysOverdue: 5,
        paymentMethod: 'Credit Card',
      },
    ];
    mockGetOverduePayments.mockResolvedValue(mockPayments);

    renderWithProviders(<OverdueAlerts />);

    await waitFor(() => {
      expect(screen.getByText('Rent payment of $1500 is 1 day overdue.')).toBeInTheDocument();
      expect(screen.getByText('Rent payment of $1700 is 5 days overdue.')).toBeInTheDocument();
    });
  });
});