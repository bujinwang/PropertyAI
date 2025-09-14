import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIReportingDashboard from './AIReportingDashboard';
import { reportingService } from '../services/reportingService';

// Mock the reporting service
jest.mock('../services/reportingService');
jest.mock('../hooks/useAuth');

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Tabs: ({ children, ...props }: any) => <div data-testid="tabs" {...props}>{children}</div>,
  Tab: ({ children, ...props }: any) => <div data-testid="tab" {...props}>{children}</div>,
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
  Dialog: ({ children, ...props }: any) => <div data-testid="dialog" {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <div data-testid="dialog-title" {...props}>{children}</div>,
  DialogContent: ({ children, ...props }: any) => <div data-testid="dialog-content" {...props}>{children}</div>,
  DialogActions: ({ children, ...props }: any) => <div data-testid="dialog-actions" {...props}>{children}</div>,
  TextField: ({ ...props }: any) => <input data-testid="text-field" {...props} />,
  Select: ({ children, ...props }: any) => <select data-testid="select" {...props}>{children}</select>,
  MenuItem: ({ children, ...props }: any) => <option {...props}>{children}</option>,
  FormControl: ({ children, ...props }: any) => <div data-testid="form-control" {...props}>{children}</div>,
  InputLabel: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

const mockReportingService = reportingService as jest.Mocked<typeof reportingService>;

describe('AIReportingDashboard', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAuth hook
    const mockUseAuth = require('../hooks/useAuth');
    mockUseAuth.useAuth = jest.fn(() => ({ user: mockUser }));

    // Mock reporting service methods
    mockReportingService.getTemplates.mockResolvedValue({
      templates: [
        {
          id: 'template-1',
          name: 'AI Executive Summary',
          sections: [
            { type: 'summary', dataSource: 'financial', visualization: 'text' },
            { type: 'insights', dataSource: 'ai', visualization: 'text' }
          ],
          ownerId: 'user-1'
        }
      ]
    });

    mockReportingService.getReports.mockResolvedValue({
      reports: [
        {
          id: 'report-1',
          templateId: 'template-1',
          reportDate: '2025-01-15',
          status: 'generated',
          aiConfidence: 87,
          content: {
            summary: 'AI-generated executive summary',
            insights: [
              {
                type: 'trend',
                title: 'Revenue Growth',
                description: '15% increase in revenue',
                confidence: 0.92
              }
            ]
          },
          periodStart: '2025-01-01',
          periodEnd: '2025-01-31'
        }
      ],
      total: 1
    });

    mockReportingService.getScheduledReports.mockResolvedValue({
      schedules: [
        {
          id: 'schedule-1',
          templateId: 'template-1',
          frequency: 'monthly',
          recipients: ['test@example.com'],
          format: 'pdf',
          isActive: true
        }
      ]
    });

    mockReportingService.getAuditTrail.mockResolvedValue({
      auditTrail: [
        {
          id: 'audit-1',
          action: 'generated',
          resourceType: 'report',
          resourceId: 'report-1',
          createdAt: '2025-01-15T10:00:00Z',
          user: { id: 'user-1', firstName: 'Test', lastName: 'User', email: 'test@example.com' },
          riskLevel: 'low',
          dataSensitivity: 'internal'
        }
      ],
      total: 1,
      hasMore: false
    });

    mockReportingService.getComplianceStatus.mockResolvedValue({
      complianceChecks: [
        {
          id: 'check-1',
          checkType: 'gdpr',
          status: 'passed',
          severity: 'low',
          findings: [],
          violations: []
        }
      ]
    });
  });

  it('renders the AI reporting dashboard with all tabs', async () => {
    render(<AIReportingDashboard />);

    expect(screen.getByText('AI Reporting Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
  });

  it('loads templates on mount', async () => {
    render(<AIReportingDashboard />);

    await waitFor(() => {
      expect(mockReportingService.getTemplates).toHaveBeenCalled();
    });
  });

  it('displays AI templates with confidence indicators', async () => {
    render(<AIReportingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('AI Executive Summary')).toBeInTheDocument();
    });

    expect(screen.getByText('2')).toBeInTheDocument(); // sections count
    expect(screen.getByText('AI')).toBeInTheDocument(); // AI indicator
  });

  it('displays reports with AI confidence scores', async () => {
    render(<AIReportingDashboard />);

    // Switch to reports tab
    const tabs = screen.getAllByTestId('tab');
    fireEvent.click(tabs[1]); // Reports tab

    await waitFor(() => {
      expect(screen.getByText('2025-01-15')).toBeInTheDocument();
    });

    expect(screen.getByText('generated')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument(); // AI confidence
  });

  it('opens report generation dialog', async () => {
    render(<AIReportingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('AI Executive Summary')).toBeInTheDocument();
    });

    const generateButton = screen.getByText('Generate Report');
    fireEvent.click(generateButton);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Generate AI Report')).toBeInTheDocument();
  });

  it('generates report with AI parameters', async () => {
    mockReportingService.generateReport.mockResolvedValue({
      id: 'new-report-1',
      templateId: 'template-1',
      status: 'generating',
      aiConfidence: 0,
      content: {}
    });

    render(<AIReportingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('AI Executive Summary')).toBeInTheDocument();
    });

    const generateButton = screen.getByText('Generate Report');
    fireEvent.click(generateButton);

    // Fill out the form
    const formatSelect = screen.getByTestId('select');
    fireEvent.change(formatSelect, { target: { value: 'pdf' } });

    const generateDialogButton = screen.getByText('Generate');
    fireEvent.click(generateDialogButton);

    await waitFor(() => {
      expect(mockReportingService.generateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'template-1',
          parameters: expect.objectContaining({
            includeAI: true,
            format: 'pdf'
          })
        })
      );
    });
  });

  it('displays AI insights in report details', async () => {
    render(<AIReportingDashboard />);

    // Switch to reports tab
    const tabs = screen.getAllByTestId('tab');
    fireEvent.click(tabs[1]);

    await waitFor(() => {
      expect(screen.getByText('2025-01-15')).toBeInTheDocument();
    });

    // Click on report to view details
    const reportRow = screen.getByText('2025-01-15').closest('tr');
    const viewButton = within(reportRow).getByRole('button', { name: /view|details/i });
    fireEvent.click(viewButton);

    expect(screen.getByText('AI-generated executive summary')).toBeInTheDocument();
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
    expect(screen.getByText('15% increase in revenue')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument(); // Insight confidence
  });

  it('handles email delivery with AI insights', async () => {
    mockReportingService.sendReportEmail.mockResolvedValue({
      success: true,
      messageId: 'msg-123'
    });

    render(<AIReportingDashboard />);

    // Switch to reports tab
    const tabs = screen.getAllByTestId('tab');
    fireEvent.click(tabs[1]);

    await waitFor(() => {
      expect(screen.getByText('2025-01-15')).toBeInTheDocument();
    });

    // Click email button
    const emailButton = screen.getByText('Email');
    fireEvent.click(emailButton);

    // Fill email form
    const emailInput = screen.getByTestId('text-field');
    fireEvent.change(emailInput, { target: { value: 'recipient@example.com' } });

    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockReportingService.sendReportEmail).toHaveBeenCalled();
    });
  });

  it('displays audit trail with AI operations', async () => {
    render(<AIReportingDashboard />);

    // Switch to audit trail tab
    const tabs = screen.getAllByTestId('tab');
    fireEvent.click(tabs[3]); // Audit Trail tab

    await waitFor(() => {
      expect(mockReportingService.getAuditTrail).toHaveBeenCalled();
    });

    expect(screen.getByText('generated')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument(); // Risk level
  });

  it('displays compliance status for AI content', async () => {
    render(<AIReportingDashboard />);

    // Switch to compliance tab
    const tabs = screen.getAllByTestId('tab');
    fireEvent.click(tabs[4]); // Compliance tab

    await waitFor(() => {
      expect(mockReportingService.getComplianceStatus).toHaveBeenCalled();
    });

    expect(screen.getByText('gdpr')).toBeInTheDocument();
    expect(screen.getByText('passed')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument(); // Severity
  });

  it('handles AI service errors gracefully', async () => {
    mockReportingService.generateReport.mockRejectedValue(new Error('AI service unavailable'));

    render(<AIReportingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('AI Executive Summary')).toBeInTheDocument();
    });

    const generateButton = screen.getByText('Generate Report');
    fireEvent.click(generateButton);

    const generateDialogButton = screen.getByText('Generate');
    fireEvent.click(generateDialogButton);

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
    });
  });

  it('displays scheduled reports with AI templates', async () => {
    render(<AIReportingDashboard />);

    // Switch to scheduled tab
    const tabs = screen.getAllByTestId('tab');
    fireEvent.click(tabs[2]); // Scheduled tab

    await waitFor(() => {
      expect(mockReportingService.getScheduledReports).toHaveBeenCalled();
    });

    expect(screen.getByText('monthly')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Recipients count
    expect(screen.getByText('pdf')).toBeInTheDocument(); // Format
  });

  it('filters audit trail by AI operations', async () => {
    render(<AIReportingDashboard />);

    // Switch to audit trail tab
    const tabs = screen.getAllByTestId('tab');
    fireEvent.click(tabs[3]);

    await waitFor(() => {
      expect(mockReportingService.getAuditTrail).toHaveBeenCalled();
    });

    // Test filtering by action
    const actionFilter = screen.getByTestId('select');
    fireEvent.change(actionFilter, { target: { value: 'generated' } });

    expect(mockReportingService.getAuditTrail).toHaveBeenCalledWith(
      'report-1',
      expect.objectContaining({
        action: 'generated'
      })
    );
  });

  it('exports reports with AI insights', async () => {
    mockReportingService.exportReport.mockResolvedValue({
      fileName: 'report-1.pdf',
      downloadUrl: 'http://example.com/download/report-1.pdf',
      format: 'pdf'
    });

    render(<AIReportingDashboard />);

    // Switch to reports tab
    const tabs = screen.getAllByTestId('tab');
    fireEvent.click(tabs[1]);

    await waitFor(() => {
      expect(screen.getByText('2025-01-15')).toBeInTheDocument();
    });

    // Click export button
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockReportingService.exportReport).toHaveBeenCalledWith('report-1', 'pdf');
    });
  });

  it('handles concurrent operations safely', async () => {
    mockReportingService.generateReport.mockResolvedValue({
      id: 'report-1',
      templateId: 'template-1',
      status: 'generated',
      aiConfidence: 85,
      content: { summary: 'Generated report' }
    });

    render(<AIReportingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('AI Executive Summary')).toBeInTheDocument();
    });

    // Trigger multiple operations
    const generateButtons = screen.getAllByText('Generate Report');
    generateButtons.forEach(button => fireEvent.click(button));

    // Should handle multiple concurrent operations without crashing
    expect(screen.getByText('AI Reporting Dashboard')).toBeInTheDocument();
  });

  it('displays loading states during AI operations', async () => {
    mockReportingService.generateReport.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        id: 'report-1',
        templateId: 'template-1',
        status: 'generated',
        aiConfidence: 85,
        content: { summary: 'Generated report' }
      }), 1000))
    );

    render(<AIReportingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('AI Executive Summary')).toBeInTheDocument();
    });

    const generateButton = screen.getByText('Generate Report');
    fireEvent.click(generateButton);

    const generateDialogButton = screen.getByText('Generate');
    fireEvent.click(generateDialogButton);

    // Should show loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});