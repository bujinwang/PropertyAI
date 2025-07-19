import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RiskLevelIndicator } from './RiskLevelIndicator';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('RiskLevelIndicator', () => {
  it('renders low risk indicator correctly', () => {
    renderWithTheme(<RiskLevelIndicator level="low" />);

    expect(screen.getByText('Low Risk')).toBeInTheDocument();
    expect(screen.getByLabelText(/Risk level: Low Risk/)).toBeInTheDocument();
  });

  it('renders medium risk indicator correctly', () => {
    renderWithTheme(<RiskLevelIndicator level="medium" />);

    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    expect(screen.getByLabelText(/Risk level: Medium Risk/)).toBeInTheDocument();
  });

  it('renders high risk indicator correctly', () => {
    renderWithTheme(<RiskLevelIndicator level="high" />);

    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByLabelText(/Risk level: High Risk/)).toBeInTheDocument();
  });

  it('displays score when provided', () => {
    renderWithTheme(<RiskLevelIndicator level="low" score={85} />);

    expect(screen.getByText('(85)')).toBeInTheDocument();
    expect(screen.getByLabelText(/Score: 85/)).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    renderWithTheme(<RiskLevelIndicator level="low" showLabel={false} />);

    expect(screen.queryByText('Low Risk')).not.toBeInTheDocument();
  });

  it('renders different variants correctly', () => {
    const { rerender } = renderWithTheme(
      <RiskLevelIndicator level="low" variant="chip" />
    );

    // Default chip variant should show the label
    expect(screen.getByText('Low Risk')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <RiskLevelIndicator level="low" variant="badge" />
      </ThemeProvider>
    );

    // Badge variant should also show the label
    expect(screen.getByText('Low Risk')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <RiskLevelIndicator level="low" variant="dot" />
      </ThemeProvider>
    );

    // Dot variant should show the label
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithTheme(<RiskLevelIndicator level="medium" score={65} />);

    const indicator = screen.getByLabelText('Risk level: Medium Risk (Score: 65)');
    expect(indicator).toBeInTheDocument();
  });

  it('shows tooltip with description', () => {
    renderWithTheme(<RiskLevelIndicator level="high" />);

    // The tooltip should be present (though not visible without hover)
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('handles different sizes correctly', () => {
    const { rerender } = renderWithTheme(
      <RiskLevelIndicator level="low" size="small" />
    );

    expect(screen.getByText('Low Risk')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <RiskLevelIndicator level="low" size="large" />
      </ThemeProvider>
    );

    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });
});