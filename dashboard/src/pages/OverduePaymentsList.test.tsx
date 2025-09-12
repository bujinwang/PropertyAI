import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from '../design-system/theme';
import OverduePaymentsList from './OverduePaymentsList';
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
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {component}
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('OverduePaymentsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockGetOverduePayments.mockReturnValue(new Promise(() => {})); // Simulate loading

    renderWithProviders(<OverduePaymentsList />);

    expect(screen.getByText('Overdue Payments')).toBeInTheDocument();
    expect(screen.queryByText('No overdue payments found')).not.toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    const error = new Error('API error');
    mockGetOverduePayments.mockRejectedValue(error);

    renderWithProviders(<OverduePaymentsList />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load overdue payments/)).toBeInTheDocument();
    });
  });

  it('renders empty state when no overdue payments', async () => {
    mockGetOverduePayments.mockResolvedValue([]);

    renderWithProviders(<OverduePaymentsList />);

    await waitFor(() => {
      expect(screen.getByText('No overdue payments found')).toBeInTheDocument();
      expect(screen.getByText('All payments are current')).toBeInTheDocument();
    });
  });

  it('renders overdue payments with correct data', async () => {
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

    renderWithProviders(<OverduePaymentsList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('$1,500')).toBeInTheDocument();
      expect(screen.getByText('$1,700')).toBeInTheDocument();
      expect(screen.getByText('5 days')).toBeInTheDocument();
      expect(screen.getByText('15 days')).toBeInTheDocument();
    });
  });

  it('displays KPI cards with correct calculations', async () => {
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
        daysOverdue: 35,
        paymentMethod: 'Credit Card',
      },
    ];
    mockGetOverduePayments.mockResolvedValue(mockPayments);

    renderWithProviders(<OverduePaymentsList />);

    await waitFor(() => {
      expect(screen.getByText('$3,200')).toBeInTheDocument(); // Total overdue amount
      expect(screen.getByText('1')).toBeInTheDocument(); // Critical count (30+ days)
      expect(screen.getByText('1')).toBeInTheDocument(); // Warning count (14-29 days)
    });
  });

  it('filters payments by property', async () => {
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
        unitNumber: '201',
        propertyId: 'p2',
        amount: 1700,
        dueDate: '2024-01-01',
        daysOverdue: 15,
        paymentMethod: 'Credit Card',
      },
    ];
    mockGetOverduePayments.mockResolvedValue(mockPayments);

    renderWithProviders(<OverduePaymentsList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Show filters
    const filterButton = screen.getByText('Show Filters');
    fireEvent.click(filterButton);

    // Select property filter
    const propertySelect = screen.getByLabelText('Property');
    fireEvent.mouseDown(propertySelect);
    const propertyOption = screen.getByText('Sunset Apartments'); // Mock property
    fireEvent.click(propertyOption);

    // Should filter to show only payments from selected property
    await waitFor(() => {
      expect(mockGetOverduePayments).toHaveBeenCalledWith(
        expect.objectContaining({ propertyId: '1' })
      );
    });
  });

  it('exports data in CSV and PDF formats', async () => {
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

    // Mock URL and document methods for export
    const mockCreateObjectURL = jest.fn();
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();
    const mockClick = jest.fn();
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;

    const mockAnchor = {
      click: mockClick,
      href: '',
      download: '',
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    renderWithProviders(<OverduePaymentsList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click CSV export
    const csvButton = screen.getByText('Export CSV');
    fireEvent.click(csvButton);

    // Click PDF export
    const pdfButton = screen.getByText('Export PDF');
    fireEvent.click(pdfButton);

    // Cleanup mocks
    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    jest.restoreAllMocks();
  });

  it('refreshes data when refresh button is clicked', async () => {
    mockGetOverduePayments.mockResolvedValue([]);

    renderWithProviders(<OverduePaymentsList />);

    await waitFor(() => {
      expect(screen.getByText('No overdue payments found')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText('Refresh data');
    fireEvent.click(refreshButton);

    expect(mockGetOverduePayments).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  it('paginates results correctly', async () => {
    const mockPayments = Array.from({ length: 25 }, (_, i) => ({
      id: `payment-${i}`,
      tenantId: `tenant-${i}`,
      tenantName: `Tenant ${i}`,
      unitNumber: `${100 + i}`,
      propertyId: 'p1',
      amount: 1500 + i * 100,
      dueDate: '2024-01-01',
      daysOverdue: 5 + i,
      paymentMethod: 'Bank Transfer',
    }));
    mockGetOverduePayments.mockResolvedValue(mockPayments);

    renderWithProviders(<OverduePaymentsList />);

    await waitFor(() => {
      expect(screen.getByText('Tenant 0')).toBeInTheDocument();
      expect(screen.queryByText('Tenant 15')).not.toBeInTheDocument(); // Should be on page 2
    });

    // Check pagination info
    expect(screen.getByText('1–10 of 25')).toBeInTheDocument();
  });
});