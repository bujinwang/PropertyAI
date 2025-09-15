import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportModal from './ExportModal';

// Mock fetch globally
global.fetch = jest.fn();

const mockCurrentFilters = {
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  propertyIds: 'prop1,prop2'
};

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  currentFilters: mockCurrentFilters
};

describe('ExportModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('renders export modal with all form elements', () => {
    render(<ExportModal {...defaultProps} />);

    expect(screen.getByText('Export Analytics Report')).toBeInTheDocument();
    expect(screen.getByLabelText('Format')).toBeInTheDocument();
    expect(screen.getByLabelText('Template')).toBeInTheDocument();
    expect(screen.getByText('Export Now')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('displays current filters information', () => {
    render(<ExportModal {...defaultProps} />);

    expect(screen.getByText('Current Filters Applied:')).toBeInTheDocument();
    expect(screen.getByText('• Date Range: 2024-01-01 to 2024-12-31')).toBeInTheDocument();
    expect(screen.getByText('• Properties: prop1,prop2')).toBeInTheDocument();
  });

  it('allows format and template selection', () => {
    render(<ExportModal {...defaultProps} />);

    const formatSelect = screen.getByLabelText('Format');
    const templateSelect = screen.getByLabelText('Template');

    fireEvent.mouseDown(formatSelect);
    fireEvent.click(screen.getByText('CSV Data'));

    fireEvent.mouseDown(templateSelect);
    fireEvent.click(screen.getByText('Audit Trail'));

    expect(formatSelect).toHaveTextContent('CSV Data');
    expect(templateSelect).toHaveTextContent('Audit Trail');
  });

  it('shows scheduling options when enabled', () => {
    render(<ExportModal {...defaultProps} />);

    const scheduleSwitch = screen.getByLabelText('Schedule Recurring Export');
    fireEvent.click(scheduleSwitch);

    expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Schedule Export')).toBeInTheDocument();
  });

  it('handles successful export with base64 data', async () => {
    const mockResponse = {
      success: true,
      data: 'base64-encoded-data'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    // Mock download functionality
    const mockCreateElement = jest.spyOn(document, 'createElement');
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn()
    };
    mockCreateElement.mockReturnValue(mockLink as any);

    const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockReturnValue(document.body);
    const mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockReturnValue(document.body);

    render(<ExportModal {...defaultProps} />);

    const exportButton = screen.getByText('Export Now');
    fireEvent.click(exportButton);

    // Check progress indicator appears
    expect(screen.getByText(/Generating export/)).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          format: 'pdf',
          template: 'tax',
          filters: mockCurrentFilters
        })
      });
    });

    // Verify download was triggered
    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.href).toBe('data:application/pdf;base64,base64-encoded-data');
      expect(mockLink.download).toContain('analytics-export-tax-');
    });

    mockCreateElement.mockRestore();
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
  });

  it('handles successful export with signed URL for large files', async () => {
    const mockResponse = {
      success: true,
      signedUrl: 'https://example.com/large-file.pdf',
      expiresIn: 3600
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    // Mock window.open
    const mockOpen = jest.spyOn(window, 'open').mockImplementation(() => null);

    render(<ExportModal {...defaultProps} />);

    const exportButton = screen.getByText('Export Now');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith('https://example.com/large-file.pdf', '_blank');
    });

    mockOpen.mockRestore();
  });

  it('handles export errors gracefully', async () => {
    const mockError = { message: 'Export failed due to server error' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(mockError)
    });

    render(<ExportModal {...defaultProps} />);

    const exportButton = screen.getByText('Export Now');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Export failed due to server error')).toBeInTheDocument();
    });
  });

  it('handles scheduled export', async () => {
    const mockResponse = { success: true };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    // Mock alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ExportModal {...defaultProps} />);

    // Enable scheduling
    const scheduleSwitch = screen.getByLabelText('Schedule Recurring Export');
    fireEvent.click(scheduleSwitch);

    // Fill scheduling form
    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const scheduleButton = screen.getByText('Schedule Export');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/schedule-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          format: 'pdf',
          template: 'tax',
          frequency: 'weekly',
          email: 'test@example.com',
          filters: mockCurrentFilters
        })
      });
    });

    expect(mockAlert).toHaveBeenCalledWith('Export scheduled successfully! You will receive weekly reports at test@example.com');

    mockAlert.mockRestore();
  });

  it('validates email for scheduled exports', () => {
    render(<ExportModal {...defaultProps} />);

    // Enable scheduling
    const scheduleSwitch = screen.getByLabelText('Schedule Recurring Export');
    fireEvent.click(scheduleSwitch);

    const scheduleButton = screen.getByText('Schedule Export');
    fireEvent.click(scheduleButton);

    expect(screen.getByText('Email is required for scheduled exports')).toBeInTheDocument();
  });

  it('closes modal when cancel is clicked', () => {
    render(<ExportModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('prevents actions during export', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ExportModal {...defaultProps} />);

    const exportButton = screen.getByText('Export Now');
    fireEvent.click(exportButton);

    // Check that cancel is disabled during export
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Exporting...')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ExportModal {...defaultProps} open={false} />);

    expect(screen.queryByText('Export Analytics Report')).not.toBeInTheDocument();
  });
});