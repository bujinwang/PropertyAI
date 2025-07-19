import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { Container, Typography, Box } from '@mui/material';
import CriticalAlertsDashboard from './CriticalAlertsDashboard';
import { EmergencyAlert } from '../../types/emergency-response';

// Mock data for manual testing
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
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
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
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
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
    type: 'security',
    title: 'Security Breach',
    description: 'Unauthorized access detected at main entrance',
    location: {
      propertyId: 'prop1',
      propertyName: 'Sunset Apartments',
      address: '123 Main St'
    },
    priority: 'high',
    status: 'in_progress',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    reportedBy: {
      id: 'system1',
      name: 'Security System',
      role: 'system'
    },
    updates: []
  },
  {
    id: '4',
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
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    reportedBy: {
      id: 'staff2',
      name: 'Maintenance Staff',
      role: 'staff'
    },
    updates: []
  },
  {
    id: '5',
    type: 'weather',
    title: 'Severe Weather Alert',
    description: 'High winds and potential power outage',
    location: {
      propertyId: 'prop1',
      propertyName: 'Sunset Apartments',
      address: '123 Main St'
    },
    priority: 'medium',
    status: 'active',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    reportedBy: {
      id: 'weather1',
      name: 'Weather Service',
      role: 'external'
    },
    updates: []
  }
];

// Mock the emergency response service
jest.mock('../../services/emergencyResponseService', () => ({
  emergencyResponseService: {
    getAlerts: jest.fn().mockResolvedValue(mockAlerts),
    connectToAlerts: jest.fn().mockReturnValue({
      close: jest.fn(),
      onmessage: null,
      send: jest.fn()
    })
  }
}));

const theme = createTheme();

const CriticalAlertsDashboardManualTest: React.FC = () => {
  const handleAlertSelect = (alert: EmergencyAlert) => {
    console.log('Selected alert:', alert);
    alert('Alert selected: ' + alert.title);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Critical Alerts Dashboard - Manual Test
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This is a manual test page for the Critical Alerts Dashboard component.
            It demonstrates the real-time alert list with priority sorting and color-coded status indicators.
          </Typography>
        </Box>

        <CriticalAlertsDashboard
          onAlertSelect={handleAlertSelect}
          maxHeight={600}
          showFilters={true}
        />

        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Test Features:
          </Typography>
          <ul>
            <li>Real-time alert list with priority sorting</li>
            <li>Color-coded status indicators (red/yellow/green)</li>
            <li>Alert type, location, and timestamp display</li>
            <li>Priority badges (Critical, High, Medium, Low)</li>
            <li>Status chips (Active, Acknowledged, In Progress, Resolved)</li>
            <li>Filtering by priority and status</li>
            <li>Sorting options</li>
            <li>Click alerts to see selection in console</li>
          </ul>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default CriticalAlertsDashboardManualTest;