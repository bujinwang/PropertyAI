import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../design-system/theme'; // Assume theme exists from previous stories
import VacantUnitsSummary from './VacantUnitsSummary';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    getVacantUnits: jest.fn(),
  },
}));

const mockGetVacantUnits = dashboardService.getVacantUnits as jest.MockedFunction<typeof dashboardService.getVacantUnits>;

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

describe('VacantUnitsSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state with Skeleton', () => {
    mockGetVacantUnits.mockReturnValue(new Promise(() => {})); // Simulate loading

    renderWithProviders(<VacantUnitsSummary />);

    // Check for absence of loaded content
    expect(screen.queryByText('Vacant Units Summary')).not.toBeInTheDocument();
    expect(screen.queryByText('No vacant units')).not.toBeInTheDocument();
  });

  it('renders error state with Alert', async () => {
    const error = new Error('API error');
    mockGetVacantUnits.mockRejectedValue(error);

    renderWithProviders(<VacantUnitsSummary />);

    await waitFor(() => {
      expect(screen.getByText('Vacant Units Summary')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load vacant units: API error/)).toBeInTheDocument();
    });
  });

  it('renders empty state when no vacant units', async () => {
    mockGetVacantUnits.mockResolvedValue([]);

    renderWithProviders(<VacantUnitsSummary />);

    await waitFor(() => {
      expect(screen.getByText('Vacant Units Summary')).toBeInTheDocument();
      expect(screen.getByText('No vacant units')).toBeInTheDocument();
      expect(screen.getByText('0 units available')).toBeInTheDocument();
    });
  });

  it('renders with data: count, list items', async () => {
    const mockUnits = [
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
      {
        id: '2',
        propertyId: 'p1',
        unitNumber: '102',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        size: 900,
        bedrooms: 2,
        bathrooms: 2,
        rent: 1700,
        availableDate: '2024-01-01',
      },
    ];
    mockGetVacantUnits.mockResolvedValue(mockUnits);

    renderWithProviders(<VacantUnitsSummary />);

    await waitFor(() => {
      expect(screen.getByText('Vacant Units Summary')).toBeInTheDocument();
      expect(screen.getByText('2 units available')).toBeInTheDocument();
      expect(screen.getByText('Unit 101')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, Anytown, CA')).toBeInTheDocument();
      expect(screen.getByText('$1500/mo • 2bd/1ba')).toBeInTheDocument();
      expect(screen.getByText('Unit 102')).toBeInTheDocument();
      expect(screen.getByText('$1700/mo • 2bd/2ba')).toBeInTheDocument();
    });
  });

  it('shows "View all" when more than 5 units', async () => {
    const manyUnits = Array.from({ length: 6 }, (_, i) => ({
      id: i.toString(),
      propertyId: 'p1',
      unitNumber: `10${i}`,
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      size: 800,
      bedrooms: 2,
      bathrooms: 1,
      rent: 1500,
      availableDate: '2024-01-01',
    }));
    mockGetVacantUnits.mockResolvedValue(manyUnits);

    renderWithProviders(<VacantUnitsSummary />);

    await waitFor(() => {
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('View all vacant units')).toBeInTheDocument();
      // Only 5 units should be rendered
      expect(screen.getAllByText(/Unit 10[0-4]/)).toHaveLength(5);
    });
  });
});