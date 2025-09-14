import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import ApplicationForm from './ApplicationForm';

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

describe('ApplicationForm', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('renders form fields and submit button', () => {
    renderWithProviders(<ApplicationForm propertyId="prop1" />);
    expect(screen.getByLabelText('Your Notes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  test('submits application and triggers screening', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, applicationId: 'app1', screeningId: 'report1' }),
    });

    renderWithProviders(<ApplicationForm propertyId="prop1" />);
    fireEvent.change(screen.getByLabelText('Your Notes'), { target: { value: 'Interested in property' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/application/submit', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ tenantId: '', applicationNotes: 'Interested in property', propertyId: 'prop1' }),
      }));
    });
  });

  test('handles submission error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Submission failed'));

    renderWithProviders(<ApplicationForm propertyId="prop1" />);
    fireEvent.change(screen.getByLabelText('Your Notes'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});