import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Layout from './Layout';

// Mock the AuthContext as the Header component uses it
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User' },
    logout: jest.fn(),
  }),
}));

const theme = createTheme();

describe('Layout Component', () => {
  beforeEach(() => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Layout />
        </MemoryRouter>
      </ThemeProvider>
    );
  });

  it('renders the header with the application title', () => {
    expect(screen.getByText('PropertyAI Dashboard')).toBeInTheDocument();
  });

  it('renders the main navigation links', () => {
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
  });

  it('renders the main content area', () => {
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
