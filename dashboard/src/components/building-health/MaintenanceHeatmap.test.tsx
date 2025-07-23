import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import MaintenanceHeatmap from './MaintenanceHeatmap';
import { MaintenanceHotspot } from '../../types/building-health';

const theme = createTheme();

const mockHotspots: MaintenanceHotspot[] = [
  {
    id: '1',
    location: 'Building A - 3rd Floor',
    severity: 'high',
    frequency: 8,
    lastIncident: new Date('2024-01-15'),
    coordinates: [40.7128, -74.0060],
    issueType: 'Electrical',
    description: 'Frequent power outages and voltage fluctuations'
  },
  {
    id: '2',
    location: 'Building B - Basement',
    severity: 'medium',
    frequency: 5,
    lastIncident: new Date('2024-01-10'),
    coordinates: [40.7130, -74.0058],
    issueType: 'Plumbing',
    description: 'Water leak in main pipe'
  },
  {
    id: '3',
    location: 'Building A - Roof',
    severity: 'low',
    frequency: 2,
    lastIncident: new Date('2024-01-05'),
    coordinates: [40.7126, -74.0062],
    issueType: 'HVAC',
    description: 'Minor ventilation issues'
  }
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('MaintenanceHeatmap', () => {
  it('renders maintenance hotspots correctly', () => {
    renderWithTheme(<MaintenanceHeatmap hotspots={mockHotspots} />);
    
    expect(screen.getByText('Maintenance Hotspots')).toBeInTheDocument();
    expect(screen.getByText('Interactive building heatmap showing maintenance issue frequency and severity')).toBeInTheDocument();
    expect(screen.getByText('Building Layout - Interactive Heatmap')).toBeInTheDocument();
  });

  it('displays hotspot summary statistics', () => {
    renderWithTheme(<MaintenanceHeatmap hotspots={mockHotspots} />);
    
    // Check for High Severity count
    expect(screen.getByText('High Severity')).toBeInTheDocument();
    // Check for Medium Severity count  
    expect(screen.getByText('Medium Severity')).toBeInTheDocument();
    // Check for Low Severity count
    expect(screen.getByText('Low Severity')).toBeInTheDocument();
    // Check for Total Incidents
    expect(screen.getByText('Total Incidents')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // Total incidents (8+5+2)
  });

  it('displays hotspot cards with correct information', () => {
    renderWithTheme(<MaintenanceHeatmap hotspots={mockHotspots} />);
    
    expect(screen.getByText('Building A - 3rd Floor')).toBeInTheDocument();
    expect(screen.getByText('Building B - Basement')).toBeInTheDocument();
    expect(screen.getByText('Building A - Roof')).toBeInTheDocument();
    
    expect(screen.getByText('Electrical')).toBeInTheDocument();
    expect(screen.getByText('Plumbing')).toBeInTheDocument();
    expect(screen.getByText('HVAC')).toBeInTheDocument();
  });

  it('filters hotspots by severity', async () => {
    renderWithTheme(<MaintenanceHeatmap hotspots={mockHotspots} />);
    
    // Click on High severity filter
    const highSeverityFilter = screen.getByText('High');
    fireEvent.click(highSeverityFilter);
    
    await waitFor(() => {
      expect(screen.getByText('Active Hotspots (1)')).toBeInTheDocument();
      expect(screen.getByText('Building A - 3rd Floor')).toBeInTheDocument();
      expect(screen.queryByText('Building B - Basement')).not.toBeInTheDocument();
    });
  });

  it('opens hotspot detail modal when clicking on a hotspot', async () => {
    renderWithTheme(<MaintenanceHeatmap hotspots={mockHotspots} />);
    
    const hotspotCard = screen.getByText('Building A - 3rd Floor').closest('.MuiCard-root');
    expect(hotspotCard).toBeInTheDocument();
    
    fireEvent.click(hotspotCard!);
    
    await waitFor(() => {
      expect(screen.getByText('Hotspot Details')).toBeInTheDocument();
      expect(screen.getByText('Frequency Trends')).toBeInTheDocument();
      expect(screen.getByText('Severity Analysis')).toBeInTheDocument();
      expect(screen.getByText('Detailed Issue History')).toBeInTheDocument();
    });
  });

  it('displays frequency trends in modal', async () => {
    renderWithTheme(<MaintenanceHeatmap hotspots={mockHotspots} />);
    
    const hotspotCard = screen.getByText('Building A - 3rd Floor').closest('.MuiCard-root');
    fireEvent.click(hotspotCard!);
    
    await waitFor(() => {
      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('Last Week')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
      expect(screen.getByText('Last Month')).toBeInTheDocument();
      expect(screen.getByText('This Quarter')).toBeInTheDocument();
    });
  });

  it('displays detailed issue history table in modal', async () => {
    renderWithTheme(<MaintenanceHeatmap hotspots={mockHotspots} />);
    
    const hotspotCard = screen.getByText('Building A - 3rd Floor').closest('.MuiCard-root');
    fireEvent.click(hotspotCard!);
    
    await waitFor(() => {
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Issue')).toBeInTheDocument();
      expect(screen.getByText('Severity')).toBeInTheDocument();
      expect(screen.getByText('Resolution')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Cost')).toBeInTheDocument();
      expect(screen.getByText('Technician')).toBeInTheDocument();
    });
  });

  it('closes modal when close button is clicked', async () => {
    renderWithTheme(<MaintenanceHeatmap hotspots={mockHotspots} />);
    
    const hotspotCard = screen.getByText('Building A - 3rd Floor').closest('.MuiCard-root');
    fireEvent.click(hotspotCard!);
    
    await waitFor(() => {
      expect(screen.getByText('Hotspot Details')).toBeInTheDocument();
    });
    
    // Find the close button in the dialog actions (the text "Close" button)
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Hotspot Details')).not.toBeInTheDocument();
    });
  });

  it('displays legend with correct information', () => {
    renderWithTheme(<MaintenanceHeatmap hotspots={mockHotspots} />);
    
    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getByText('Severity Levels')).toBeInTheDocument();
    expect(screen.getByText('Frequency Indicators')).toBeInTheDocument();
    expect(screen.getByText('High Severity (Immediate attention)')).toBeInTheDocument();
    expect(screen.getByText('Medium Severity (Schedule soon)')).toBeInTheDocument();
    expect(screen.getByText('Low Severity (Monitor)')).toBeInTheDocument();
  });

  it('handles empty hotspots array', () => {
    renderWithTheme(<MaintenanceHeatmap hotspots={[]} />);
    
    expect(screen.getByText('Maintenance Hotspots')).toBeInTheDocument();
    expect(screen.getByText('Active Hotspots (0)')).toBeInTheDocument();
    expect(screen.getByText('High Severity')).toBeInTheDocument();
    expect(screen.getByText('Medium Severity')).toBeInTheDocument();
    expect(screen.getByText('Low Severity')).toBeInTheDocument();
    expect(screen.getByText('Total Incidents')).toBeInTheDocument();
  });
});