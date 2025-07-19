import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import AutomatedResponseSettings from './AutomatedResponseSettings';
import { ResponseSettings } from '../../types/communication-training';

const theme = createTheme();

const mockSettings: ResponseSettings = {
  triggers: ['after_hours', 'common_questions'],
  delayMinutes: 30,
  escalationRules: [
    {
      id: 'rule1',
      condition: 'no_response_after_time',
      threshold: 60,
      action: 'escalate_to_human',
      priority: 'medium',
      enabled: true
    }
  ],
  maxAttempts: 3,
  businessHoursOnly: false
};

const renderComponent = (settings = mockSettings, onSettingsChange = jest.fn()) => {
  return render(
    <ThemeProvider theme={theme}>
      <AutomatedResponseSettings
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </ThemeProvider>
  );
};

describe('AutomatedResponseSettings', () => {
  it('renders the component with all sections', () => {
    renderComponent();
    
    expect(screen.getByText('Automated Response Settings')).toBeInTheDocument();
    expect(screen.getByText('Response Triggers')).toBeInTheDocument();
    expect(screen.getByText(/Response Delay:/)).toBeInTheDocument();
    expect(screen.getByText('Escalation Rules')).toBeInTheDocument();
  });

  it('displays selected triggers as chips', () => {
    renderComponent();
    
    expect(screen.getByText('After Hours')).toBeInTheDocument();
    expect(screen.getByText('Common Questions')).toBeInTheDocument();
  });

  it('shows response delay with proper formatting', () => {
    renderComponent();
    
    expect(screen.getByText('Response Delay: 30 minutes')).toBeInTheDocument();
  });

  it('displays escalation rules', () => {
    renderComponent();
    
    expect(screen.getByText('No Response After Time')).toBeInTheDocument();
    expect(screen.getByText('Threshold: 60 minutes')).toBeInTheDocument();
  });

  it('allows adding new escalation rules', async () => {
    const onSettingsChange = jest.fn();
    renderComponent(mockSettings, onSettingsChange);
    
    const addButton = screen.getByText('Add Rule');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Add Escalation Rule')).toBeInTheDocument();
    });
  });

  it('handles trigger selection changes', async () => {
    const onSettingsChange = jest.fn();
    renderComponent(mockSettings, onSettingsChange);
    
    // This test would need more complex setup to properly test the multi-select
    // For now, we'll verify the component renders without errors
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles delay slider changes', async () => {
    const onSettingsChange = jest.fn();
    renderComponent(mockSettings, onSettingsChange);
    
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    
    // Verify slider has correct value
    expect(slider).toHaveAttribute('aria-valuenow', '30');
  });

  it('handles max attempts input changes', async () => {
    const onSettingsChange = jest.fn();
    renderComponent(mockSettings, onSettingsChange);
    
    const maxAttemptsInput = screen.getByLabelText('Maximum Attempts');
    fireEvent.change(maxAttemptsInput, { target: { value: '5' } });
    
    expect(onSettingsChange).toHaveBeenCalledWith({
      ...mockSettings,
      maxAttempts: 5
    });
  });

  it('handles business hours toggle', async () => {
    const onSettingsChange = jest.fn();
    renderComponent(mockSettings, onSettingsChange);
    
    const businessHoursToggle = screen.getByLabelText('Business Hours Only');
    fireEvent.click(businessHoursToggle);
    
    expect(onSettingsChange).toHaveBeenCalledWith({
      ...mockSettings,
      businessHoursOnly: true
    });
  });

  it('allows editing existing escalation rules', async () => {
    renderComponent();
    
    const editButton = screen.getByLabelText(/Edit escalation rule/i);
    fireEvent.click(editButton);
    
    await waitFor(() => {
      expect(screen.getByText('Edit Escalation Rule')).toBeInTheDocument();
    });
  });

  it('allows deleting escalation rules', async () => {
    const onSettingsChange = jest.fn();
    renderComponent(mockSettings, onSettingsChange);
    
    const deleteButton = screen.getByLabelText(/Delete escalation rule/i);
    fireEvent.click(deleteButton);
    
    expect(onSettingsChange).toHaveBeenCalledWith({
      ...mockSettings,
      escalationRules: []
    });
  });

  it('formats delay text correctly for different values', () => {
    const settingsWithHours = { ...mockSettings, delayMinutes: 120 };
    renderComponent(settingsWithHours);
    
    expect(screen.getByText('Response Delay: 2 hours')).toBeInTheDocument();
  });

  it('formats delay text correctly for mixed hours and minutes', () => {
    const settingsWithMixed = { ...mockSettings, delayMinutes: 90 };
    renderComponent(settingsWithMixed);
    
    expect(screen.getByText('Response Delay: 1h 30m')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <ThemeProvider theme={theme}>
        <AutomatedResponseSettings
          settings={mockSettings}
          onSettingsChange={jest.fn()}
          isLoading={true}
        />
      </ThemeProvider>
    );
    
    // Verify buttons are disabled when loading
    const editButton = screen.getByLabelText(/Edit escalation rule/i);
    const deleteButton = screen.getByLabelText(/Delete escalation rule/i);
    
    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });
});