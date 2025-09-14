import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import OwnerReview from './OwnerReview';

const mockFetch = jest.fn();

const renderWithProviders = (ui) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  global.fetch = mockFetch;
});

describe('OwnerReview', () => {
  test('renders review queue', () => {
    renderWithProviders(<OwnerReview />);
    expect(screen.getByText('Owner Review Queue')).toBeInTheDocument();
  });

  test('approves application and invalidates queries', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ applications: [{ id: 'app1', tenant: { name: 'Test Tenant' }, property: { address: '123 Test St' } }] }),
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { rerender } = renderWithProviders(<OwnerReview />, { wrapper: ({ children }) => (
      <QueryClientProvider client={client}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    ) });

    fireEvent.click(screen.getByRole('button', { name: /approve/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/application/app1/approve', expect.objectContaining({
        method: 'POST',
      }));
      expect(client.invalidateQueries).toHaveBeenCalledWith(['pendingApplications']);
    });
  });

  test('rejects application and invalidates queries', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ applications: [{ id: 'app2', tenant: { name: 'Test Tenant' }, property: { address: '456 Test St' } }] }),
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { rerender } = renderWithProviders(<OwnerReview />, { wrapper: ({ children }) => (
      <QueryClientProvider client={client}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    ) });

    fireEvent.click(screen.getByRole('button', { name: /reject/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/application/app2/reject', expect.objectContaining({
        method: 'POST',
      }));
      expect(client.invalidateQueries).toHaveBeenCalledWith(['pendingApplications']);
    });
  });
});