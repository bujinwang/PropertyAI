import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuditTrailViewer from './AuditTrailViewer';
import { reportingService } from '../services/reportingService';

// Mock the reporting service
jest.mock('../services/reportingService');
jest.mock('../hooks/useAuth');

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
  TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
  TableContainer: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TableHead: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  Typography: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CircularProgress: () => <div data-testid="loading-spinner">Loading...</div>,
  Alert: ({ children, ...props }: any) => <div data-testid="alert" {...props}>{children}</div>,
  Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  IconButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  TextField: ({ ...props }: any) => <input data-testid="text-field" {...props} />,
  Select: ({ children, ...props }: any) => <select data-testid="select" {...props}>{children}</select>,
  MenuItem: ({ children, ...props }: any) => <option {...props}>{children}</option>,
  FormControl: ({ children, ...props }: any) => <div data-testid="form-control" {...props}>{children}</div>,
  InputLabel: ({ children, ...props }: any) => <label {...props}>{children}</label>,
  Tooltip: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

const mockReportingService = reportingService as jest.Mocked<typeof reportingService>;

describe('AuditTrailViewer', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' };
  const mockReportId = 'report-1';

  const mockAuditLogs = [
    {
      id: 'audit-1',
      action: 'viewed',
      resourceType: 'report',
      resourceId: mockReportId,
      createdAt: '2025-01-15T10:00:00Z',
      user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      riskLevel: 'low',
      dataSensitivity: 'internal',
      ipAddress: '192.168.1.1'
    },
    {
      id: 'audit-2',
      action: 'exported',
      resourceType: 'report',
      resourceId: mockReportId,
      createdAt: '2025-01-15T11:00:00Z',
      user: { id: 'user-2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      riskLevel: 'medium',
      dataSensitivity: 'confidential',
      ipAddress: '192.168.1.2'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAuth hook
    const mockUseAuth = require('../hooks/useAuth');
    mockUseAuth.useAuth = jest.fn(() => ({ user: mockUser }));

    // Mock reporting service methods
    mockReportingService.getReportAuditTrail.mockResolvedValue({
      logs: mockAuditLogs,
      total: 2,
      hasMore: false
    });
  });

  it('renders the audit trail viewer with title', () => {
    render(<AuditTrailViewer reportId={mockReportId} />);

    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Report Activity Log')).toBeInTheDocument();
  });

  it('loads audit trail on mount', async () => {
    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(mockReportingService.getReportAuditTrail).toHaveBeenCalledWith(mockReportId, {});
    });
  });

  it('displays audit logs in table format', async () => {
    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('viewed')).toBeInTheDocument();
    expect(screen.getByText('exported')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
  });

  it('displays risk levels with appropriate styling', async () => {
    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('displays data sensitivity levels', async () => {
    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(screen.getByText('internal')).toBeInTheDocument();
    });

    expect(screen.getByText('confidential')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    mockReportingService.getReportAuditTrail.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AuditTrailViewer reportId={mockReportId} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockReportingService.getReportAuditTrail.mockRejectedValue(new Error('Failed to load audit trail'));

    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
    });
  });

  it('handles empty audit trail', async () => {
    mockReportingService.getReportAuditTrail.mockResolvedValue({
      logs: [],
      total: 0,
      hasMore: false
    });

    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(mockReportingService.getReportAuditTrail).toHaveBeenCalled();
    });

    expect(screen.getByText('No audit logs found')).toBeInTheDocument();
  });

  it('filters audit logs by action type', async () => {
    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find and interact with filter controls
    const actionFilter = screen.getByTestId('select');
    fireEvent.change(actionFilter, { target: { value: 'viewed' } });

    expect(mockReportingService.getReportAuditTrail).toHaveBeenCalledWith(
      mockReportId,
      expect.objectContaining({
        actions: ['viewed']
      })
    );
  });

  it('filters audit logs by date range', async () => {
    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mock date inputs
    const startDateInput = screen.getAllByTestId('text-field')[0];
    const endDateInput = screen.getAllByTestId('text-field')[1];

    fireEvent.change(startDateInput, { target: { value: '2025-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2025-01-31' } });

    expect(mockReportingService.getReportAuditTrail).toHaveBeenCalledWith(
      mockReportId,
      expect.objectContaining({
        startDate: expect.any(Date),
        endDate: expect.any(Date)
      })
    );
  });

  it('handles pagination for large audit trails', async () => {
    const largeAuditLogs = Array.from({ length: 50 }, (_, i) => ({
      id: `audit-${i}`,
      action: 'viewed',
      resourceType: 'report',
      resourceId: mockReportId,
      createdAt: `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      user: { id: `user-${i}`, firstName: 'User', lastName: String(i), email: `user${i}@example.com` },
      riskLevel: 'low',
      dataSensitivity: 'internal'
    }));

    mockReportingService.getReportAuditTrail.mockResolvedValue({
      logs: largeAuditLogs.slice(0, 10),
      total: 50,
      hasMore: true
    });

    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(screen.getByText('User 0')).toBeInTheDocument();
    });

    // Should display pagination controls
    expect(screen.getByText('1-10 of 50')).toBeInTheDocument();
  });

  it('exports audit trail data', async () => {
    // Mock export functionality
    const mockBlob = new Blob(['mock,csv,data'], { type: 'text/csv' });
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();

    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  it('displays detailed audit information on row click', async () => {
    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on a table row to view details
    const firstRow = screen.getByText('John Doe').closest('tr');
    fireEvent.click(firstRow);

    // Should show detailed view
    expect(screen.getByText('Audit Log Details')).toBeInTheDocument();
    expect(screen.getByText('viewed')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('handles network errors during data fetch', async () => {
    mockReportingService.getReportAuditTrail.mockRejectedValue(new Error('Network error'));

    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load audit trail')).toBeInTheDocument();
  });

  it('refreshes audit trail data', async () => {
    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(mockReportingService.getReportAuditTrail).toHaveBeenCalledTimes(1);
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockReportingService.getReportAuditTrail).toHaveBeenCalledTimes(2);
    });
  });

  it('displays security events with appropriate warnings', async () => {
    const securityAuditLogs = [
      {
        id: 'audit-security-1',
        action: 'unauthorized_access_attempt',
        resourceType: 'report',
        resourceId: mockReportId,
        createdAt: '2025-01-15T10:00:00Z',
        user: { id: 'user-1', firstName: 'Unknown', lastName: 'User', email: 'unknown@example.com' },
        riskLevel: 'high',
        dataSensitivity: 'confidential',
        ipAddress: '10.0.0.1'
      }
    ];

    mockReportingService.getReportAuditTrail.mockResolvedValue({
      logs: securityAuditLogs,
      total: 1,
      hasMore: false
    });

    render(<AuditTrailViewer reportId={mockReportId} />);

    await waitFor(() => {
      expect(screen.getByText('Unknown User')).toBeInTheDocument();
    });

    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('unauthorized_access_attempt')).toBeInTheDocument();
  });
});