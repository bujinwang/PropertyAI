import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import CriticalAlertsDashboard from './CriticalAlertsDashboard';
import { emergencyResponseService } from '../../services/emergencyResponseService';
import { EmergencyAlert } from '../../types/emergency-response';

// Mock the emergency response service
jest.mock('../../services/emergencyResponseService');
const mockEmergencyResponseService = emergencyResponseService as jest.Mocked<typeof emergencyResponseService>;

// Mock WebSocket
const mockWebSocket = {
  close: jest.fn(),
  onmessage: null as ((event: MessageEvent) => void) | null,
  send: jest.fn()
};

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '5 minutes ago')
}));

const theme = createTheme();

const mockAlerts: EmergencyAlert[] = [
  {
    id: '1',
    type: 'fire',
    title: 'Fire Alarm Activated',
    description: 'Smoke detected in Building A, Floor 3',
    location: {
      propertyId: 'prop1',
      propertyName: 'Sunset Apartments',
      unitNumber: '3A',
      address: '123 Main St'
    },
    priority: 'critical',
    status: 'active',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    reportedBy: {
      id: 'user1',
      name: 'John Doe',
      role: 'tenant'
    },
    updates: []
  },
  {
    id: '2',
    type: 'medical',
    title: 'Medical Emergency',
    description: 'Tenant reported chest pain',
    location: {
      propertyId: 'prop1',
      propertyName: 'Sunset Apartments',
      unitNumber: '2B',
      address: '123 Main St'
    },
    priority: 'high',
    status: 'acknowledged',
    timestamp: new Date('2024-01-15T10:25:00Z'),
    reportedBy: {
      id: 'user2',
      name: 'Jane Smith',
      role: 'tenant'
    },
    assignedTo: {
      id: 'staff1',
      name: 'Emergency Team',
      role: 'emergency_responder',
      contact: '+1234567890'
    },
    updates: []
  },
  {
    id: '3',
    type: 'maintenance',
    title: 'Water Leak',
    description: 'Pipe burst in basement',
    location: {
      propertyId: 'prop1',
      propertyName: 'Sunset Apartments',
      address: '123 Main St'
    },
    priority: 'medium',
    status: 'in_progress',
    timestamp: new Date('2024-01-15T10:20:00Z'),
    reportedBy: {
      id: 'staff2',
      name: 'Maintenance Staff',
      role: 'staff'
    },
    updates: []
  }
];

const renderComponent = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <CriticalAlertsDashboard {...props} />
    </ThemeProvider>
  );
};

describe('CriticalAlertsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEmergencyResponseService.getAlerts.mockResolvedValue(mockAlerts);
    mockEmergencyResponseService.connectToAlerts.mockReturnValue(mockWebSocket as any);
  });

  it('renders the dashboard title and badges', async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Critical Alerts Dashboard')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      const badges = screen.getAllByText('1');
      expect(badges).toHaveLength(2); // Critical and high priority badges
    });
  });

  it('displays alerts with correct information', async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Fire Alarm Activated')).toBeInTheDocument();
      expect(screen.getByText('Medical Emergency')).toBeInTheDocument();
      expect(screen.getByText('Water Leak')).toBeInTheDocument();
    });

    // Check alert details
    expect(screen.getByText('Smoke detected in Building A, Floor 3')).toBeInTheDocument();
    expect(screen.getByText('Sunset Apartments - Unit 3A')).toBeInTheDocument();
    
    // Check for multiple time stamps
    const timeStamps = screen.getAllByText('5 minutes ago');
    expect(timeStamps.length).toBeGreaterThan(0);
  });

  it('displays priority chips with correct colors', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });
  });

  it('displays status chips correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('ACKNOWLEDGED')).toBeInTheDocument();
      expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    });
  });

  it('shows assigned personnel when available', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Assigned to: Emergency Team')).toBeInTheDocument();
    });
  });

  it('handles alert selection', async () => {
    const onAlertSelect = jest.fn();
    renderComponent({ onAlertSelect });

    await waitFor(() => {
      expect(screen.getByText('Fire Alarm Activated')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Fire Alarm Activated'));
    expect(onAlertSelect).toHaveBeenCalledWith(mockAlerts[0]);
  });

  it('handles sorting changes', async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Priority (High to Low)')).toBeInTheDocument();
    });

    const sortSelect = screen.getByLabelText('Sort By');
    
    await act(async () => {
      fireEvent.mouseDown(sortSelect);
    });
    
    const newestFirstOption = await screen.findByText('Newest First');
    
    await act(async () => {
      fireEvent.click(newestFirstOption);
    });

    await waitFor(() => {
      expect(mockEmergencyResponseService.getAlerts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ['active', 'acknowledged', 'in_progress']
        }),
        { field: 'timestamp', direction: 'desc' }
      );
    });
  });

  it('handles priority filtering', async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    });

    const prioritySelect = screen.getByLabelText('Priority');
    
    await act(async () => {
      fireEvent.mouseDown(prioritySelect);
    });
    
    const criticalOption = await screen.findByText('Critical');
    
    await act(async () => {
      fireEvent.click(criticalOption);
    });

    await waitFor(() => {
      expect(mockEmergencyResponseService.getAlerts).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: ['critical'],
          status: ['active', 'acknowledged', 'in_progress']
        }),
        expect.any(Object)
      );
    });
  });

  it('handles status filtering', async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Status');
    
    await act(async () => {
      fireEvent.mouseDown(statusSelect);
    });
    
    const activeOption = await screen.findByText('Active');
    
    await act(async () => {
      fireEvent.click(activeOption);
    });

    await waitFor(() => {
      expect(mockEmergencyResponseService.getAlerts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.arrayContaining(['active'])
        }),
        expect.any(Object)
      );
    });
  });

  it('handles refresh button click', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText('Refresh alerts')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText('Refresh alerts');
    fireEvent.click(refreshButton);

    expect(mockEmergencyResponseService.getAlerts).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  it('displays loading state', () => {
    mockEmergencyResponseService.getAlerts.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error state', async () => {
    const errorMessage = 'Failed to load alerts';
    mockEmergencyResponseService.getAlerts.mockRejectedValue(new Error(errorMessage));
    
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays empty state when no alerts', async () => {
    mockEmergencyResponseService.getAlerts.mockResolvedValue([]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No alerts found matching the current filters.')).toBeInTheDocument();
    });
  });

  it('establishes WebSocket connection for real-time updates', () => {
    renderComponent();

    expect(mockEmergencyResponseService.connectToAlerts).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('handles real-time alert updates', async () => {
    renderComponent();

    // Get the callback functions passed to connectToAlerts
    const [onAlert, onUpdate] = mockEmergencyResponseService.connectToAlerts.mock.calls[0];

    // Simulate a new alert
    const newAlert: EmergencyAlert = {
      ...mockAlerts[0],
      id: '4',
      title: 'New Emergency'
    };

    await waitFor(() => {
      expect(screen.getByText('Fire Alarm Activated')).toBeInTheDocument();
    });

    // Trigger the callback
    onAlert(newAlert);

    await waitFor(() => {
      expect(screen.getByText('New Emergency')).toBeInTheDocument();
    });
  });

  it('applies correct styling for critical alerts', async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const criticalAlert = screen.getByText('Fire Alarm Activated').closest('button');
      expect(criticalAlert).toHaveStyle('border: 2px solid #d32f2f');
    });
  });

  it('applies correct styling for high priority alerts', async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const highAlert = screen.getByText('Medical Emergency').closest('button');
      expect(highAlert).toHaveStyle('border: 1px solid #f57c00');
    });
  });

  it('hides filters when showFilters is false', () => {
    renderComponent({ showFilters: false });

    expect(screen.queryByLabelText('Sort By')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Priority')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument();
  });

  it('respects maxHeight prop', async () => {
    const maxHeight = 400;
    
    await act(async () => {
      renderComponent({ maxHeight });
    });

    await waitFor(() => {
      const list = screen.getByRole('list');
      const scrollableContainer = list.parentElement;
      expect(scrollableContainer).toHaveStyle(`max-height: ${maxHeight}px`);
    });
  });
});