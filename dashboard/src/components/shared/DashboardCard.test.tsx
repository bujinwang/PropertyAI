import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Button } from '@mui/material';
import DashboardCard from './DashboardCard';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('DashboardCard', () => {
  const defaultProps = {
    title: 'Test Card',
    children: <div>Card content</div>
  };

  it('renders basic card with title and content', () => {
    renderWithTheme(<DashboardCard {...defaultProps} />);
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    renderWithTheme(
      <DashboardCard {...defaultProps} subtitle="Test subtitle" />
    );
    
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    const actions = <Button>Test Action</Button>;
    renderWithTheme(
      <DashboardCard {...defaultProps} actions={actions} />
    );
    
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });

  it('shows loading state with skeletons', () => {
    renderWithTheme(<DashboardCard {...defaultProps} loading={true} />);
    
    // Check for skeleton elements by class
    const { container } = renderWithTheme(<DashboardCard {...defaultProps} loading={true} />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
    
    // Content should not be visible during loading
    expect(screen.queryByText('Card content')).not.toBeInTheDocument();
  });

  it('shows error state with alert', () => {
    const errorMessage = 'Something went wrong';
    renderWithTheme(
      <DashboardCard {...defaultProps} error={errorMessage} />
    );
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    
    // Content should not be visible during error
    expect(screen.queryByText('Card content')).not.toBeInTheDocument();
  });

  it('shows AI-generated indicator when aiGenerated is true', () => {
    renderWithTheme(<DashboardCard {...defaultProps} aiGenerated={true} />);
    
    expect(screen.getByLabelText('AI Generated Content')).toBeInTheDocument();
  });

  it('does not show AI indicator when aiGenerated is false', () => {
    renderWithTheme(<DashboardCard {...defaultProps} aiGenerated={false} />);
    
    expect(screen.queryByLabelText('AI Generated Content')).not.toBeInTheDocument();
  });

  it('hides actions during loading state', () => {
    const actions = <Button>Test Action</Button>;
    renderWithTheme(
      <DashboardCard {...defaultProps} actions={actions} loading={true} />
    );
    
    expect(screen.queryByText('Test Action')).not.toBeInTheDocument();
  });

  it('hides actions during error state', () => {
    const actions = <Button>Test Action</Button>;
    renderWithTheme(
      <DashboardCard 
        {...defaultProps} 
        actions={actions} 
        error="Test error" 
      />
    );
    
    expect(screen.queryByText('Test Action')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithTheme(<DashboardCard {...defaultProps} />);
    
    const card = screen.getByRole('region');
    expect(card).toHaveAttribute('aria-labelledby', 'card-title-test-card');
  });

  it('applies custom elevation', () => {
    const { container } = renderWithTheme(
      <DashboardCard {...defaultProps} elevation={3} />
    );
    
    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveClass('MuiPaper-elevation3');
  });

  it('applies custom sx styles', () => {
    const customSx = { backgroundColor: 'red' };
    renderWithTheme(
      <DashboardCard {...defaultProps} sx={customSx} />
    );
    
    const card = screen.getByRole('region');
    expect(card).toHaveStyle('background-color: rgb(255, 0, 0)');
  });

  it('maintains responsive design structure', () => {
    const { container } = renderWithTheme(<DashboardCard {...defaultProps} />);
    
    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveStyle('display: flex');
    expect(card).toHaveStyle('flex-direction: column');
    expect(card).toHaveStyle('height: 100%');
  });
});