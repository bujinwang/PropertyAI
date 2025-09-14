import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import AnalyticsDashboard from '../dashboard/src/components/AnalyticsDashboard';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithClient = (component) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>{component}</QueryClientProvider>
  );
};

global.fetch = jest.fn();

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderWithClient(<AnalyticsDashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders metrics after loading', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        occupancyRate: 80,
        totalRevenue: 5000,
        avgRent: 1200,
        activeTenants: 8
      })
    });
    renderWithClient(<AnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('$5000')).toBeInTheDocument();
      expect(screen.getByText('$1200')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  it('updates filters and refetches', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        occupancyRate: 75,
        totalRevenue: 4500,
        avgRent: 1100,
        activeTenants: 7
      })
    });
    renderWithClient(<AnalyticsDashboard />);
    const dateFromInput = screen.getByLabelText('Date From');
    fireEvent.change(dateFromInput, { target: { value: '2023-01-01' } });
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/analytics/metrics?dateFrom=2023-01-01T00:00:00.000Z&dateTo=2025-09-14T00:00:00.000Z&propertyIds=');
    });
  });

  it('handles error state', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500
    });
    renderWithClient(<AnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Error loading analytics: Failed to fetch metrics')).toBeInTheDocument();
    });
  });
});