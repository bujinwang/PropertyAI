import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MarketplaceSearch from './MarketplaceSearch';

const mockFetch = jest.fn();

const renderWithQueryClient = (ui) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      {ui}
    </QueryClientProvider>
  );
};

describe('MarketplaceSearch', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    global.fetch = mockFetch;
  });

  test('renders search input and button', () => {
    renderWithQueryClient(<MarketplaceSearch />);
    expect(screen.getByLabelText('Search properties')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  test('performs search on button click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'match1', property: { address: '123 Main St' }, matchScore: 0.8 }],
    });

    renderWithQueryClient(<MarketplaceSearch />);
    fireEvent.change(screen.getByLabelText('Search properties'), { target: { value: 'Seattle apartment' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/search', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ searchTerm: 'Seattle apartment', filters: {} }),
      }));
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });
  });

  test('displays matches list', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'match1', property: { address: '123 Main St' }, matchScore: 0.8 }],
    });

    renderWithQueryClient(<MarketplaceSearch />);
    fireEvent.change(screen.getByLabelText('Search properties'), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Score: 0.8')).toBeInTheDocument();
    });
  });
});