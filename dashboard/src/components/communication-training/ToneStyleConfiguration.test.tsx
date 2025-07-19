import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ToneStyleConfiguration from './ToneStyleConfiguration';
import { ToneStyleConfig, DEFAULT_TONE_STYLE_EXAMPLES } from '../../types/communication-training';

const theme = createTheme();

const mockConfig: ToneStyleConfig = {
  tone: 'friendly',
  style: 'detailed',
  examples: DEFAULT_TONE_STYLE_EXAMPLES
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ToneStyleConfiguration', () => {
  const mockOnConfigChange = jest.fn();

  beforeEach(() => {
    mockOnConfigChange.mockClear();
  });

  it('renders the component with correct title and sections', () => {
    renderWithTheme(
      <ToneStyleConfiguration
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
      />
    );

    expect(screen.getByText('Tone and Style Configuration')).toBeInTheDocument();
    expect(screen.getByText('Communication Tone')).toBeInTheDocument();
    expect(screen.getByText('Communication Style')).toBeInTheDocument();
  });

  it('displays all tone options with examples', () => {
    renderWithTheme(
      <ToneStyleConfiguration
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
      />
    );

    expect(screen.getByText('Formal')).toBeInTheDocument();
    expect(screen.getByText('Friendly')).toBeInTheDocument();
    expect(screen.getByText('Casual')).toBeInTheDocument();

    // Check that examples are displayed
    expect(screen.getByText(/Professional and business-like communication/)).toBeInTheDocument();
    expect(screen.getByText(/Warm and approachable communication/)).toBeInTheDocument();
    expect(screen.getByText(/Relaxed and conversational communication/)).toBeInTheDocument();
  });

  it('displays all style options with examples', () => {
    renderWithTheme(
      <ToneStyleConfiguration
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
      />
    );

    expect(screen.getByText('Concise')).toBeInTheDocument();
    expect(screen.getByText('Detailed')).toBeInTheDocument();
    expect(screen.getByText('Empathetic')).toBeInTheDocument();

    // Check that examples are displayed
    expect(screen.getByText(/Brief and to-the-point responses/)).toBeInTheDocument();
    expect(screen.getByText(/Comprehensive and thorough responses/)).toBeInTheDocument();
    expect(screen.getByText(/Understanding and supportive responses/)).toBeInTheDocument();
  });

  it('shows selected indicators for current configuration', () => {
    renderWithTheme(
      <ToneStyleConfiguration
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
      />
    );

    // Should show "Selected" chips for friendly tone and detailed style
    const selectedChips = screen.getAllByText('Selected');
    expect(selectedChips).toHaveLength(2);
  });

  it('displays combined preview with current configuration', () => {
    renderWithTheme(
      <ToneStyleConfiguration
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
      />
    );

    expect(screen.getByText('Current Configuration Preview')).toBeInTheDocument();
    expect(screen.getByText('Friendly Tone')).toBeInTheDocument();
    expect(screen.getByText('Detailed Style')).toBeInTheDocument();
    expect(screen.getByText('Combined Example Response')).toBeInTheDocument();
  });

  it('calls onConfigChange when tone is changed', () => {
    renderWithTheme(
      <ToneStyleConfiguration
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
      />
    );

    const formalRadio = screen.getByRole('radio', { name: /Formal/ });
    fireEvent.click(formalRadio);

    expect(mockOnConfigChange).toHaveBeenCalledWith({
      ...mockConfig,
      tone: 'formal'
    });
  });

  it('calls onConfigChange when style is changed', () => {
    renderWithTheme(
      <ToneStyleConfiguration
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
      />
    );

    const conciseRadio = screen.getByRole('radio', { name: /Concise/ });
    fireEvent.click(conciseRadio);

    expect(mockOnConfigChange).toHaveBeenCalledWith({
      ...mockConfig,
      style: 'concise'
    });
  });

  it('disables controls when loading', () => {
    renderWithTheme(
      <ToneStyleConfiguration
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isLoading={true}
      />
    );

    const radios = screen.getAllByRole('radio');
    radios.forEach(radio => {
      expect(radio).toBeDisabled();
    });
  });

  it('displays the correct combined example based on current selection', () => {
    const casualConciseConfig: ToneStyleConfig = {
      tone: 'casual',
      style: 'concise',
      examples: DEFAULT_TONE_STYLE_EXAMPLES
    };

    renderWithTheme(
      <ToneStyleConfiguration
        config={casualConciseConfig}
        onConfigChange={mockOnConfigChange}
      />
    );

    // Should display the casual + concise example
    expect(screen.getByText(DEFAULT_TONE_STYLE_EXAMPLES.casual.concise)).toBeInTheDocument();
  });

  it('highlights selected options with appropriate styling', () => {
    renderWithTheme(
      <ToneStyleConfiguration
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
      />
    );

    const friendlyRadio = screen.getByRole('radio', { name: /Friendly/ });
    const detailedRadio = screen.getByRole('radio', { name: /Detailed/ });

    expect(friendlyRadio).toBeChecked();
    expect(detailedRadio).toBeChecked();
  });
});