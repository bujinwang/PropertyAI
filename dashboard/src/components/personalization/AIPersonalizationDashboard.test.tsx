/**
 * AI Personalization Dashboard Tests
 * Tests for the personalization dashboard component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AIPersonalizationDashboard from './AIPersonalizationDashboard';

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

const renderComponent = (props = {}) => {
  const defaultProps = {
    userId: 'test-user-123',
    onPreferencesUpdate: jest.fn(),
    onRefresh: jest.fn(),
  };

  return render(
    <TestWrapper>
      <AIPersonalizationDashboard {...defaultProps} {...props} />
    </TestWrapper>
  );
};

describe('AIPersonalizationDashboard', () => {
  it('renders loading state initially', () => {
    renderComponent();
    
    expect(screen.getByText('Loading your personalized recommendations...')).toBeInTheDocument();
  });

  it('renders dashboard header after loading', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Your Personalized Recommendations')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Discover local services, community events, and exclusive offers tailored just for you.')).toBeInTheDocument();
  });

  it('displays summary statistics', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Total Recommendations')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Last Updated')).toBeInTheDocument();
    expect(screen.getByText('AI Powered')).toBeInTheDocument();
    expect(screen.getByText('Personalized')).toBeInTheDocument();
  });

  it('displays recommendation categories', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Local Services')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Community Events')).toBeInTheDocument();
    expect(screen.getByText('Exclusive Offers')).toBeInTheDocument();
  });
});