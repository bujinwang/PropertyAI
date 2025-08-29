import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard from '../pages/Dashboard';

const theme = createTheme();

describe('Dashboard Page', () => {
  beforeEach(() => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </ThemeProvider>
    );
  });

  it('renders the main dashboard title', () => {
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders the summary card for Vacant Units', () => {
    expect(screen.getByText('Vacant Units')).toBeInTheDocument();
  });

  it('renders the card for Recent Maintenance Requests', () => {
    expect(screen.getByText('Recent Maintenance Requests')).toBeInTheDocument();
  });

  it('renders the Alerts card', () => {
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });
});
