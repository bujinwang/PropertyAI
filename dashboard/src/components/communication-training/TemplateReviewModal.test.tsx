import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import TemplateReviewModal from './TemplateReviewModal';
import { CommunicationTemplate, TemplateStatus } from '../../types/communication-training';

const theme = createTheme();

const mockTemplate: CommunicationTemplate = {
  id: '1',
  title: 'Test Template',
  content: 'This is a test template content for maintenance requests. It includes all the necessary information for tenants.',
  category: 'Maintenance',
  trigger: 'maintenance_requests',
  status: 'pending' as TemplateStatus,
  createdBy: 'AI System',
  createdAt: new Date('2024-01-15T10:00:00Z'),
  confidence: 0.85
};

const renderComponent = (props: Partial<React.ComponentProps<typeof TemplateReviewModal>> = {}) => {
  const defaultProps = {
    open: true,
    template: mockTemplate,
    onClose: jest.fn(),
    onApprove: jest.fn(),
    onReject: jest.fn(),
    isLoading: false
  };

  return render(
    <ThemeProvider theme={theme}>
      <TemplateReviewModal {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('TemplateReviewModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with template information', () => {
    renderComponent();
    
    expect(screen.getByText('Review Template: Test Template')).toBeInTheDocument();
    expect(screen.getByText('Category: Maintenance')).toBeInTheDocument();
    expect(screen.getByText('Trigger: Maintenance Requests')).toBeInTheDocument();
    expect(screen.getByText('Status: Pending')).toBeInTheDocument();
    expect(screen.getByText(/Created by AI System/)).toBeInTheDocument();
  });

  it('displays template content in AI-generated content wrapper', () => {
    renderComponent();
    
    expect(screen.getByText(/This is a test template content for maintenance requests/)).toBeInTheDocument();
  });

  it('shows confidence indicator', () => {
    renderComponent();
    
    expect(screen.getByText('AI Confidence Score')).toBeInTheDocument();
  });

  it('displays review guidelines', () => {
    renderComponent();
    
    expect(screen.getByText('Review Guidelines')).toBeInTheDocument();
    expect(screen.getByText(/Ensure the template aligns with your communication standards/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    renderComponent({ onClose: mockOnClose });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    const mockOnClose = jest.fn();
    renderComponent({ onClose: mockOnClose });
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows approval comment field when approve is clicked', async () => {
    renderComponent();
    
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Approval Comments (Optional)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Add any comments about the approval...')).toBeInTheDocument();
    });
  });

  it('shows rejection reason field when reject is clicked', async () => {
    renderComponent();
    
    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Rejection Reason (Required)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Please provide a reason for rejection...')).toBeInTheDocument();
    });
  });

  it('calls onApprove with comments when approval is confirmed', async () => {
    const mockOnApprove = jest.fn();
    renderComponent({ onApprove: mockOnApprove });
    
    // Click approve
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);
    
    // Add comments
    await waitFor(() => {
      const commentField = screen.getByPlaceholderText('Add any comments about the approval...');
      fireEvent.change(commentField, { target: { value: 'Looks good!' } });
    });
    
    // Confirm approval
    const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
    fireEvent.click(confirmButton);
    
    expect(mockOnApprove).toHaveBeenCalledWith('Looks good!');
  });

  it('calls onApprove without comments when approval is confirmed without comments', async () => {
    const mockOnApprove = jest.fn();
    renderComponent({ onApprove: mockOnApprove });
    
    // Click approve
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);
    
    // Confirm approval without adding comments
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
      fireEvent.click(confirmButton);
    });
    
    expect(mockOnApprove).toHaveBeenCalledWith(undefined);
  });

  it('calls onReject with reason when rejection is confirmed', async () => {
    const mockOnReject = jest.fn();
    renderComponent({ onReject: mockOnReject });
    
    // Click reject
    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);
    
    // Add rejection reason
    await waitFor(() => {
      const commentField = screen.getByPlaceholderText('Please provide a reason for rejection...');
      fireEvent.change(commentField, { target: { value: 'Template needs improvement' } });
    });
    
    // Confirm rejection
    const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
    fireEvent.click(confirmButton);
    
    expect(mockOnReject).toHaveBeenCalledWith('Template needs improvement');
  });

  it('prevents rejection confirmation without reason', async () => {
    renderComponent();
    
    // Click reject
    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);
    
    // Try to confirm without reason
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
      expect(confirmButton).toBeDisabled();
    });
  });

  it('shows error message when rejection reason is empty', async () => {
    renderComponent();
    
    // Click reject
    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Rejection reason is required')).toBeInTheDocument();
    });
  });

  it('allows going back from action confirmation', async () => {
    renderComponent();
    
    // Click approve
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);
    
    // Click back
    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);
    });
    
    // Should be back to initial state
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    renderComponent({ isLoading: true });
    
    expect(screen.getByRole('button', { name: /close/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reject/i })).toBeDisabled();
  });

  it('formats trigger labels correctly', () => {
    const templateWithUnderscores = {
      ...mockTemplate,
      trigger: 'payment_inquiries' as const
    };
    
    renderComponent({ template: templateWithUnderscores });
    
    expect(screen.getByText('Trigger: Payment Inquiries')).toBeInTheDocument();
  });
});