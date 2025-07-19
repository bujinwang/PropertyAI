import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SummaryMetrics } from './SummaryMetrics';
import { RiskAssessmentMetrics } from '../../types/risk-assessment';

const theme = createTheme();

const mockMetrics: RiskAssessmentMetrics = {
  totalApplicants: 24,
  riskCategories: {
    low: 12,
    medium: 8,
    high: 4,
  },
  averageScore: 67.5,
  pendingReviews: 6,
  lastUpdated: new Date('2024-01-15T10:30:00Z'),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('SummaryMetrics', () => {
  it('renders all metric cards correctly', () => {
    renderWithTheme(<SummaryMetrics metrics={mockMetrics} />);

    expect(screen.getByText('Risk Assessment Overview')).toBeInTheDocument();
    expect(screen.getByText('Total Applicants')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('Average Score')).toBeInTheDocument();
    expect(screen.getByText('67.5')).toBeInTheDocument();
    expect(screen.getByText('Pending Reviews')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('displays risk categories correctly', () => {
    renderWithTheme(<SummaryMetrics metrics={mockMetrics} />);

    expect(screen.getByText('Risk Categories')).toBeInTheDocument();
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    
    // Check the counts
    const riskCounts = screen.getAllByText('12');
    expect(riskCounts.length).toBeGreaterThan(0);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    renderWithTheme(<SummaryMetrics metrics={mockMetrics} loading={true} />);

    // Should show skeleton loaders instead of content
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const mockOnRefresh = jest.fn();
    renderWithTheme(
      <SummaryMetrics metrics={mockMetrics} onRefresh={mockOnRefresh} />
    );

    const refreshButton = screen.getByLabelText('Refresh metrics');
    fireEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('formats last updated time correctly', () => {
    renderWithTheme(<SummaryMetrics metrics={mockMetrics} />);

    // Should show some form of "Last updated" text
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('does not show refresh button when onRefresh is not provided', () => {
    renderWithTheme(<SummaryMetrics metrics={mockMetrics} />);

    expect(screen.queryByLabelText('Refresh metrics')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithTheme(<SummaryMetrics metrics={mockMetrics} onRefresh={jest.fn()} />);

    const refreshButton = screen.getByLabelText('Refresh metrics');
    expect(refreshButton).toHaveAttribute('aria-label', 'Refresh metrics');
  });
});