import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import TemplateApprovalWorkflow from './TemplateApprovalWorkflow';
import { AuthProvider } from '../../contexts/AuthContext';
import { CommunicationTemplate, TemplateStatus } from '../../types/communication-training';

// Mock the AuthContext
const mockUser = {
  id: '1',
  name: 'Test Manager',
  email: 'manager@test.com',
  role: 'manager'
};

const mockAuthContext = {
  user: mockUser,
  token: 'test-token',
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn()
};

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockAuthContext
}));

const theme = createTheme();

const mockTemplates: CommunicationTemplate[] = [
  {
    id: '1',
    title: 'Test Template 1',
    content: 'This is a test template content for maintenance requests.',
    category: 'Maintenance',
    trigger: 'maintenance_requests',
    status: 'pending' as TemplateStatus,
    createdBy: 'AI System',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    confidence: 0.85
  },
  {
    id: '2',
    title: 'Test Template 2',
    content: 'This is another test template for payment inquiries.',
    category: 'Payment',
    trigger: 'payment_inquiries',
    status: 'pending' as TemplateStatus,
    createdBy: 'AI System',
    createdAt: new Date('2024-01-16T14:30:00Z'),
    confidence: 0.92
  }
];

const renderComponent = (props: Partial<React.ComponentProps<typeof TemplateApprovalWorkflow>> = {}) => {
  const defaultProps = {
    pendingTemplates: mockTemplates,
    onTemplateUpdate: jest.fn(),
    isLoading: false
  };

  return render(
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <TemplateApprovalWorkflow {...defaultProps} {...props} />
      </AuthProvider>
    </ThemeProvider>
  );
};

describe('TemplateApprovalWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders template approval queue with pending templates', () => {
    renderComponent();
    
    expect(screen.getByText('Template Approval Queue')).toBeInTheDocument();
    expect(screen.getByText('2 Pending')).toBeInTheDocument();
    expect(screen.getByText('Test Template 1')).toBeInTheDocument();
    expect(screen.getByText('Test Template 2')).toBeInTheDocument();
  });

  it('shows empty state when no templates are pending', () => {
    renderComponent({ pendingTemplates: [] });
    
    expect(screen.getByText('No templates pending approval at this time.')).toBeInTheDocument();
  });

  it('displays template metadata correctly', () => {
    renderComponent();
    
    expect(screen.getByText(/Category: Maintenance/)).toBeInTheDocument();
    expect(screen.getByText(/Trigger: maintenance requests/)).toBeInTheDocument();
    expect(screen.getByText(/Created by AI System/)).toBeInTheDocument();
  });

  it('opens review modal when view button is clicked', async () => {
    renderComponent();
    
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Review Template: Test Template 1')).toBeInTheDocument();
    });
  });

  it('calls onTemplateUpdate when template is approved', async () => {
    const mockOnTemplateUpdate = jest.fn();
    renderComponent({ onTemplateUpdate: mockOnTemplateUpdate });
    
    // Open modal
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Review Template: Test Template 1')).toBeInTheDocument();
    });
    
    // Click approve
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);
    
    // Confirm approval
    const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
    fireEvent.click(confirmButton);
    
    expect(mockOnTemplateUpdate).toHaveBeenCalledWith('1', 'approved', undefined);
  });

  it('calls onTemplateUpdate when template is rejected with comments', async () => {
    const mockOnTemplateUpdate = jest.fn();
    renderComponent({ onTemplateUpdate: mockOnTemplateUpdate });
    
    // Open modal
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Review Template: Test Template 1')).toBeInTheDocument();
    });
    
    // Click reject
    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);
    
    // Add rejection reason
    const commentField = screen.getByPlaceholderText(/Please provide a reason for rejection/);
    fireEvent.change(commentField, { target: { value: 'Template needs improvement' } });
    
    // Confirm rejection
    const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
    fireEvent.click(confirmButton);
    
    expect(mockOnTemplateUpdate).toHaveBeenCalledWith('1', 'rejected', 'Template needs improvement');
  });

  it('does not render for users without approver role', () => {
    // Mock user without approver role
    const mockNonApproverUser = {
      ...mockUser,
      role: 'tenant'
    };
    
    // Create a new mock context with non-approver user
    const mockNonApproverContext = {
      ...mockAuthContext,
      user: mockNonApproverUser
    };
    
    // Mock the useAuth hook to return the non-approver context
    jest.doMock('../../contexts/AuthContext', () => ({
      ...jest.requireActual('../../contexts/AuthContext'),
      useAuth: () => mockNonApproverContext
    }));
    
    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });

  it('shows loading state correctly', () => {
    renderComponent({ isLoading: true });
    
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    viewButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('displays confidence scores for templates', () => {
    renderComponent();
    
    // The confidence scores should be visible in the modal when opened
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);
    
    // Check that confidence indicator is rendered (it should be in the modal)
    expect(screen.getByText(/AI Confidence Score/)).toBeInTheDocument();
  });
});