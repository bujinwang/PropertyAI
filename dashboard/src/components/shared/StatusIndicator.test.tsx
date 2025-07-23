import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StatusIndicator from './StatusIndicator';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('StatusIndicator', () => {
  const defaultProps = {
    status: 'success' as const,
    label: 'Test Status'
  };

  it('renders with default chip variant', () => {
    renderWithTheme(<StatusIndicator {...defaultProps} />);
    
    expect(screen.getByLabelText('Status: Test Status')).toBeInTheDocument();
    expect(screen.getByText('Test Status')).toBeInTheDocument();
  });

  it('renders dot variant correctly', () => {
    renderWithTheme(
      <StatusIndicator {...defaultProps} variant="dot" />
    );
    
    expect(screen.getByText('Test Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Status: Test Status')).toBeInTheDocument();
  });

  it('renders badge variant correctly', () => {
    renderWithTheme(
      <StatusIndicator {...defaultProps} variant="badge" />
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Test Status')).toBeInTheDocument();
  });

  it('handles different status types correctly', () => {
    const statuses = ['success', 'warning', 'error', 'info'] as const;
    
    statuses.forEach(status => {
      const { rerender } = renderWithTheme(
        <StatusIndicator status={status} label={`${status} status`} />
      );
      
      expect(screen.getByText(`${status} status`)).toBeInTheDocument();
      
      rerender(
        <ThemeProvider theme={theme}>
          <StatusIndicator status={status} label="next status" />
        </ThemeProvider>
      );
    });
  });

  it('handles extended status types correctly', () => {
    const extendedStatuses = ['good', 'critical', 'operational', 'offline'] as const;
    
    extendedStatuses.forEach(status => {
      renderWithTheme(
        <StatusIndicator status={status} label={`${status} status`} />
      );
      
      expect(screen.getByText(`${status} status`)).toBeInTheDocument();
    });
  });

  it('renders different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach(size => {
      const { container } = renderWithTheme(
        <StatusIndicator {...defaultProps} size={size} label={`${size} status`} />
      );
      
      expect(screen.getByText(`${size} status`)).toBeInTheDocument();
    });
  });

  it('hides icon when showIcon is false', () => {
    const { container } = renderWithTheme(
      <StatusIndicator {...defaultProps} showIcon={false} />
    );
    
    // Check that no icon is rendered in chip
    const chip = container.querySelector('.MuiChip-root');
    const icon = chip?.querySelector('.MuiChip-icon');
    expect(icon).toBeNull();
  });

  it('shows icon when showIcon is true (default)', () => {
    const { container } = renderWithTheme(
      <StatusIndicator {...defaultProps} showIcon={true} />
    );
    
    // Check that icon is rendered in chip
    const chip = container.querySelector('.MuiChip-root');
    const icon = chip?.querySelector('.MuiChip-icon');
    expect(icon).toBeInTheDocument();
  });

  it('has proper accessibility attributes for chip variant', () => {
    renderWithTheme(<StatusIndicator {...defaultProps} />);
    
    const statusElement = screen.getByLabelText('Status: Test Status');
    expect(statusElement).toBeInTheDocument();
  });

  it('has proper accessibility attributes for badge variant', () => {
    renderWithTheme(
      <StatusIndicator {...defaultProps} variant="badge" />
    );
    
    const statusElement = screen.getByRole('status');
    expect(statusElement).toHaveAttribute('aria-label', 'Status: Test Status');
  });

  it('has proper accessibility attributes for dot variant', () => {
    renderWithTheme(
      <StatusIndicator {...defaultProps} variant="dot" />
    );
    
    const statusElement = screen.getByLabelText('Status: Test Status');
    expect(statusElement).toBeInTheDocument();
  });

  it('applies correct color coding for success status', () => {
    const { container } = renderWithTheme(
      <StatusIndicator status="success" label="Success" />
    );
    
    const chip = container.querySelector('.MuiChip-colorSuccess');
    expect(chip).toBeInTheDocument();
  });

  it('applies correct color coding for error status', () => {
    const { container } = renderWithTheme(
      <StatusIndicator status="error" label="Error" />
    );
    
    const chip = container.querySelector('.MuiChip-colorError');
    expect(chip).toBeInTheDocument();
  });

  it('applies correct color coding for warning status', () => {
    const { container } = renderWithTheme(
      <StatusIndicator status="warning" label="Warning" />
    );
    
    const chip = container.querySelector('.MuiChip-colorWarning');
    expect(chip).toBeInTheDocument();
  });

  it('applies correct color coding for info status', () => {
    const { container } = renderWithTheme(
      <StatusIndicator status="info" label="Info" />
    );
    
    const chip = container.querySelector('.MuiChip-colorInfo');
    expect(chip).toBeInTheDocument();
  });

  it('maintains consistent visual hierarchy across variants', () => {
    const variants = ['dot', 'badge', 'chip'] as const;
    
    variants.forEach(variant => {
      renderWithTheme(
        <StatusIndicator 
          {...defaultProps} 
          variant={variant}
          label={`${variant} test`}
        />
      );
      
      expect(screen.getByText(`${variant} test`)).toBeInTheDocument();
    });
  });
});