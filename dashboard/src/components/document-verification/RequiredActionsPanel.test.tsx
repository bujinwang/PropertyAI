import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RequiredActionsPanel from './RequiredActionsPanel';
import { RequiredAction } from '../../types/document-verification';

const theme = createTheme();

const mockActions: RequiredAction[] = [
  {
    id: '1',
    description: 'Provide clearer photo of government ID',
    priority: 'high',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    completed: false,
    aiGenerated: true,
    confidence: 85,
    explanation: 'AI analysis detected low image quality'
  },
  {
    id: '2',
    description: 'Submit recent bank statement',
    priority: 'medium',
    completed: false,
    aiGenerated: false
  },
  {
    id: '3',
    description: 'Verify employment details',
    priority: 'low',
    completed: true,
    aiGenerated: false
  }
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('RequiredActionsPanel', () => {
  it('renders required actions', () => {
    renderWithTheme(<RequiredActionsPanel actions={mockActions} />);
    
    expect(screen.getByText('Required Actions')).toBeInTheDocument();
    expect(screen.getByText('2 pending')).toBeInTheDocument();
  });

  it('displays pending and completed actions separately', () => {
    renderWithTheme(<RequiredActionsPanel actions={mockActions} />);
    
    expect(screen.getByText('Provide clearer photo of government ID')).toBeInTheDocument();
    expect(screen.getByText('Submit recent bank statement')).toBeInTheDocument();
    expect(screen.getByText('Completed Actions (1)')).toBeInTheDocument();
  });

  it('shows AI-generated indicators', () => {
    renderWithTheme(<RequiredActionsPanel actions={mockActions} />);
    
    expect(screen.getByText('AI-Generated')).toBeInTheDocument();
    expect(screen.getByText('1 AI-suggested')).toBeInTheDocument();
  });

  it('displays priority indicators', () => {
    renderWithTheme(<RequiredActionsPanel actions={mockActions} />);
    
    // Check for priority indicators in the action items
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    // Check for summary chips
    expect(screen.getByText('1 high priority')).toBeInTheDocument();
  });

  it('shows success message when all actions completed', () => {
    const completedActions = mockActions.map(action => ({ ...action, completed: true }));
    renderWithTheme(<RequiredActionsPanel actions={completedActions} />);
    
    expect(screen.getByText('All required actions have been completed!')).toBeInTheDocument();
  });

  it('calls onActionUpdate when action is toggled', async () => {
    const mockOnActionUpdate = jest.fn();
    renderWithTheme(
      <RequiredActionsPanel actions={mockActions} onActionUpdate={mockOnActionUpdate} />
    );
    
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(mockOnActionUpdate).toHaveBeenCalledWith('1', true);
    });
  });
});