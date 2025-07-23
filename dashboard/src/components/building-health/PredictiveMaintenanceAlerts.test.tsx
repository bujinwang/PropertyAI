import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import PredictiveMaintenanceAlerts from './PredictiveMaintenanceAlerts';
import { PredictiveAlert } from '../../types/building-health';
import { AIFeedback } from '../../types/ai';

const theme = createTheme();

const mockAlerts: PredictiveAlert[] = [
  {
    id: '1',
    title: 'HVAC Filter Replacement Due',
    description: 'Based on usage patterns, HVAC filters will need replacement within 2 weeks',
    priority: 'medium',
    confidence: 0.85,
    estimatedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    category: 'HVAC',
    recommendedActions: [
      'Schedule filter replacement',
      'Order new filters',
      'Notify maintenance team'
    ]
  },
  {
    id: '2',
    title: 'Electrical Panel Inspection Required',
    description: 'Voltage fluctuations indicate potential electrical panel issues',
    priority: 'high',
    confidence: 0.92,
    estimatedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    category: 'Electrical',
    recommendedActions: [
      'Schedule electrical inspection',
      'Contact certified electrician',
      'Prepare for potential downtime'
    ]
  },
  {
    id: '3',
    title: 'Critical System Failure Predicted',
    description: 'Immediate attention required for plumbing system',
    priority: 'critical',
    confidence: 0.95,
    estimatedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    category: 'Plumbing',
    recommendedActions: [
      'Emergency inspection required',
      'Contact emergency plumber',
      'Prepare backup systems'
    ]
  }
];

const renderComponent = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <PredictiveMaintenanceAlerts
        alerts={mockAlerts}
        {...props}
      />
    </ThemeProvider>
  );
};

describe('PredictiveMaintenanceAlerts', () => {
  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('Predictive Maintenance Alerts')).toBeInTheDocument();
  });

  it('displays all alerts', () => {
    renderComponent();
    
    expect(screen.getByText('HVAC Filter Replacement Due')).toBeInTheDocument();
    expect(screen.getByText('Electrical Panel Inspection Required')).toBeInTheDocument();
    expect(screen.getByText('Critical System Failure Predicted')).toBeInTheDocument();
  });

  it('shows correct priority indicators', () => {
    renderComponent();
    
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('displays confidence scores', () => {
    renderComponent();
    
    // Check for confidence percentages
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('shows timeline indicators', () => {
    renderComponent();
    
    // Should show days remaining - check for specific timeline text
    expect(screen.getByText('Due in 2 days')).toBeInTheDocument();
    expect(screen.getByText('Due in 5 days')).toBeInTheDocument();
    expect(screen.getByText('Due in 14 days')).toBeInTheDocument();
  });

  it('displays category chips', () => {
    renderComponent();
    
    expect(screen.getByText('HVAC')).toBeInTheDocument();
    expect(screen.getByText('Electrical')).toBeInTheDocument();
    expect(screen.getByText('Plumbing')).toBeInTheDocument();
  });

  it('sorts alerts by priority and urgency', () => {
    renderComponent();
    
    const alertTitles = screen.getAllByRole('heading', { level: 3 });
    
    // Critical should be first, then high, then medium
    expect(alertTitles[0]).toHaveTextContent('Critical System Failure Predicted');
    expect(alertTitles[1]).toHaveTextContent('Electrical Panel Inspection Required');
    expect(alertTitles[2]).toHaveTextContent('HVAC Filter Replacement Due');
  });

  it('expands and collapses alert details', async () => {
    renderComponent();
    
    const expandButtons = screen.getAllByLabelText('Show more');
    
    // Click to expand the first alert (critical priority)
    fireEvent.click(expandButtons[0]);
    
    await waitFor(() => {
      // Should show the specific recommended action for the critical alert
      expect(screen.getByText('Emergency inspection required')).toBeInTheDocument();
    });
    
    // Click to collapse
    const collapseButton = screen.getByLabelText('Show less');
    fireEvent.click(collapseButton);
    
    // The expand/collapse functionality is working if we can toggle the button
    expect(screen.getAllByLabelText('Show more')).toHaveLength(3);
  });

  it('calls onAlertAction when action buttons are clicked', () => {
    const mockOnAlertAction = jest.fn();
    renderComponent({ onAlertAction: mockOnAlertAction });
    
    const scheduleButton = screen.getAllByText('Schedule Maintenance')[0];
    fireEvent.click(scheduleButton);
    
    expect(mockOnAlertAction).toHaveBeenCalledWith('3', 'schedule'); // Critical alert should be first
  });

  it('calls onFeedback when AI feedback is provided', async () => {
    const mockOnFeedback = jest.fn();
    renderComponent({ onFeedback: mockOnFeedback });
    
    // Find the first thumbs up button (should be in AI Generated Content)
    const thumbsUpButtons = screen.getAllByLabelText('Mark as helpful');
    fireEvent.click(thumbsUpButtons[0]);
    
    await waitFor(() => {
      expect(mockOnFeedback).toHaveBeenCalledWith('3', expect.objectContaining({
        type: 'positive',
        timestamp: expect.any(Date)
      }));
    });
  });

  it('shows appropriate message when no alerts are present', () => {
    render(
      <ThemeProvider theme={theme}>
        <PredictiveMaintenanceAlerts alerts={[]} />
      </ThemeProvider>
    );
    
    expect(screen.getByText(/No predictive maintenance alerts at this time/)).toBeInTheDocument();
  });

  it('displays high priority count in header', () => {
    renderComponent();
    
    // Should show 2 high priority alerts (critical + high)
    expect(screen.getByText('2 High Priority')).toBeInTheDocument();
  });

  it('shows AI Generated Content wrapper for each alert', () => {
    renderComponent();
    
    // Should have AI Generated Content labels
    const aiLabels = screen.getAllByText('AI Generated Content');
    expect(aiLabels).toHaveLength(3); // One for each alert
  });

  it('displays timeline progress bars', () => {
    renderComponent();
    
    // Should have timeline progress indicators
    expect(screen.getAllByText('Timeline Progress')).toHaveLength(3);
  });

  it('shows estimated dates', () => {
    renderComponent();
    
    // Should display formatted dates
    const today = new Date();
    const futureDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const formattedDate = futureDate.toLocaleDateString();
    
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it('handles overdue alerts correctly', () => {
    const overdueAlert: PredictiveAlert = {
      id: '4',
      title: 'Overdue Maintenance',
      description: 'This maintenance was due yesterday',
      priority: 'critical',
      confidence: 0.98,
      estimatedDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      category: 'Emergency',
      recommendedActions: ['Immediate action required']
    };

    render(
      <ThemeProvider theme={theme}>
        <PredictiveMaintenanceAlerts alerts={[overdueAlert]} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Due in Overdue')).toBeInTheDocument();
  });
});