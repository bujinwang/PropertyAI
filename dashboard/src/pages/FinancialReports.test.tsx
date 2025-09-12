import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../design-system/theme';
import FinancialReports from './FinancialReports';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    getFinancialReports: jest.fn(),
    exportReport: jest.fn(),
  },
}));

const mockGetFinancialReports = dashboardService.getFinancialReports as jest.MockedFunction<typeof dashboardService.getFinancialReports>;
const mockExportReport = dashboardService.exportReport as jest.MockedFunction<typeof dashboardService.exportReport>;

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

describe('FinancialReports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockGetFinancialReports.mockReturnValue(new Promise(() => {})); // Simulate loading

    renderWithProviders(<FinancialReports />);

    expect(screen.getByText('Financial Reports')).toBeInTheDocument();
    expect(screen.queryByText('No financial data available')).not.toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    const error = new Error('API error');
    mockGetFinancialReports.mockRejectedValue(error);

    renderWithProviders(<FinancialReports />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load financial reports/)).toBeInTheDocument();
    });
  });

  it('renders empty state when no reports available', async () => {
    mockGetFinancialReports.mockResolvedValue([]);

    renderWithProviders(<FinancialReports />);

    await waitFor(() => {
      expect(screen.getByText('No financial data available')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your report parameters or check back later')).toBeInTheDocument();
    });
  });

  it('renders financial report with correct KPI data', async () => {
    const mockReport = [
      {
        id: 'report-1',
        type: 'monthly' as const,
        period: '2024-01',
        totalRevenue: 50000,
        totalOverdue: 2500,
        paymentTrends: [
          {
            date: '2024-01-01',
            amount: 1500,
            status: 'paid' as const,
          },
          {
            date: '2024-01-15',
            amount: 800,
            status: 'overdue' as const,
          },
        ],
        propertyBreakdown: [
          {
            propertyId: 'p1',
            propertyName: 'Sunset Apartments',
            revenue: 30000,
            overdue: 1500,
          },
          {
            propertyId: 'p2',
            propertyName: 'Riverside Complex',
            revenue: 20000,
            overdue: 1000,
          },
        ],
      },
    ];
    mockGetFinancialReports.mockResolvedValue(mockReport);

    renderWithProviders(<FinancialReports />);

    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument(); // Total Revenue
      expect(screen.getByText('$2,500')).toBeInTheDocument(); // Total Overdue
      expect(screen.getByText('90%')).toBeInTheDocument(); // Collection Rate
      expect(screen.getByText('2')).toBeInTheDocument(); // Properties count
    });
  });

  it('displays property breakdown correctly', async () => {
    const mockReport = [
      {
        id: 'report-1',
        type: 'monthly' as const,
        period: '2024-01',
        totalRevenue: 50000,
        totalOverdue: 2500,
        paymentTrends: [],
        propertyBreakdown: [
          {
            propertyId: 'p1',
            propertyName: 'Sunset Apartments',
            revenue: 30000,
            overdue: 1500,
          },
        ],
      },
    ];
    mockGetFinancialReports.mockResolvedValue(mockReport);

    renderWithProviders(<FinancialReports />);

    await waitFor(() => {
      expect(screen.getByText('Sunset Apartments')).toBeInTheDocument();
      expect(screen.getByText('Property ID: p1')).toBeInTheDocument();
      expect(screen.getByText('$30,000')).toBeInTheDocument();
      expect(screen.getByText('Overdue: $1,500')).toBeInTheDocument();
    });
  });

  it('changes report type and updates data', async () => {
    const monthlyReport = [
      {
        id: 'report-1',
        type: 'monthly' as const,
        period: '2024-01',
        totalRevenue: 50000,
        totalOverdue: 2500,
        paymentTrends: [],
        propertyBreakdown: [],
      },
    ];

    const quarterlyReport = [
      {
        id: 'report-2',
        type: 'quarterly' as const,
        period: '2024-01',
        totalRevenue: 150000,
        totalOverdue: 7500,
        paymentTrends: [],
        propertyBreakdown: [],
      },
    ];

    mockGetFinancialReports
      .mockResolvedValueOnce(monthlyReport)
      .mockResolvedValueOnce(quarterlyReport);

    renderWithProviders(<FinancialReports />);

    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    // Change to quarterly
    const typeSelect = screen.getByLabelText('Report Type');
    fireEvent.mouseDown(typeSelect);
    const quarterlyOption = screen.getByText('Quarterly');
    fireEvent.click(quarterlyOption);

    await waitFor(() => {
      expect(screen.getByText('$150,000')).toBeInTheDocument();
      expect(mockGetFinancialReports).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'quarterly' })
      );
    });
  });

  it('updates period and refreshes data', async () => {
    const mockReport = [
      {
        id: 'report-1',
        type: 'monthly' as const,
        period: '2024-01',
        totalRevenue: 50000,
        totalOverdue: 2500,
        paymentTrends: [],
        propertyBreakdown: [],
      },
    ];
    mockGetFinancialReports.mockResolvedValue(mockReport);

    renderWithProviders(<FinancialReports />);

    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    // Change period
    const periodInput = screen.getByLabelText('Period');
    fireEvent.change(periodInput, { target: { value: '2024-02' } });

    await waitFor(() => {
      expect(mockGetFinancialReports).toHaveBeenCalledWith(
        expect.objectContaining({ period: '2024-02' })
      );
    });
  });

  it('exports report in CSV format', async () => {
    const mockReport = [
      {
        id: 'report-1',
        type: 'monthly' as const,
        period: '2024-01',
        totalRevenue: 50000,
        totalOverdue: 2500,
        paymentTrends: [],
        propertyBreakdown: [],
      },
    ];
    mockGetFinancialReports.mockResolvedValue(mockReport);

    // Mock blob and download
    const mockBlob = new Blob(['test data'], { type: 'text/csv' });
    mockExportReport.mockResolvedValue(mockBlob);

    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;

    const mockAnchor = {
      click: jest.fn(),
      href: '',
      download: '',
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    renderWithProviders(<FinancialReports />);

    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    // Click CSV export
    const csvButton = screen.getByText('Export CSV');
    fireEvent.click(csvButton);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith('csv', 'monthly', expect.any(Object));
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    // Cleanup
    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    jest.restoreAllMocks();
  });

  it('exports report in PDF format', async () => {
    const mockReport = [
      {
        id: 'report-1',
        type: 'monthly' as const,
        period: '2024-01',
        totalRevenue: 50000,
        totalOverdue: 2500,
        paymentTrends: [],
        propertyBreakdown: [],
      },
    ];
    mockGetFinancialReports.mockResolvedValue(mockReport);

    const mockBlob = new Blob(['test pdf data'], { type: 'application/pdf' });
    mockExportReport.mockResolvedValue(mockBlob);

    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.createObjectURL = mockCreateObjectURL;

    const mockAnchor = {
      click: jest.fn(),
      href: '',
      download: '',
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    renderWithProviders(<FinancialReports />);

    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    // Click PDF export
    const pdfButton = screen.getByText('Export PDF');
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith('pdf', 'monthly', expect.any(Object));
    });

    // Cleanup
    global.URL.createObjectURL = jest.fn();
    jest.restoreAllMocks();
  });

  it('disables export buttons when no data available', async () => {
    mockGetFinancialReports.mockResolvedValue([]);

    renderWithProviders(<FinancialReports />);

    await waitFor(() => {
      expect(screen.getByText('No financial data available')).toBeInTheDocument();
    });

    const csvButton = screen.getByText('Export CSV');
    const pdfButton = screen.getByText('Export PDF');

    expect(csvButton).toBeDisabled();
    expect(pdfButton).toBeDisabled();
  });

  it('refreshes data when refresh button is clicked', async () => {
    const mockReport = [
      {
        id: 'report-1',
        type: 'monthly' as const,
        period: '2024-01',
        totalRevenue: 50000,
        totalOverdue: 2500,
        paymentTrends: [],
        propertyBreakdown: [],
      },
    ];
    mockGetFinancialReports.mockResolvedValue(mockReport);

    renderWithProviders(<FinancialReports />);

    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText('Refresh data');
    fireEvent.click(refreshButton);

    expect(mockGetFinancialReports).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  it('formats currency values correctly', async () => {
    const mockReport = [
      {
        id: 'report-1',
        type: 'monthly' as const,
        period: '2024-01',
        totalRevenue: 1234567.89,
        totalOverdue: 98765.43,
        paymentTrends: [],
        propertyBreakdown: [
          {
            propertyId: 'p1',
            propertyName: 'Test Property',
            revenue: 1234567.89,
            overdue: 98765.43,
          },
        ],
      },
    ];
    mockGetFinancialReports.mockResolvedValue(mockReport);

    renderWithProviders(<FinancialReports />);

    await waitFor(() => {
      expect(screen.getByText('$1,234,567.89')).toBeInTheDocument();
      expect(screen.getByText('$98,765.43')).toBeInTheDocument();
    });
  });
});