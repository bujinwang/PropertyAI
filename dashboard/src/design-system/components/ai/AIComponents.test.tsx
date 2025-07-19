import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import {
  AIGeneratedContent,
  ConfidenceIndicator,
  SuggestionChip,
  ExplanationTooltip,
  LoadingStateIndicator,
} from './index';

// Test wrapper with theme
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('AI Components', () => {
  describe('AIGeneratedContent', () => {
    it('renders with basic props', () => {
      render(
        <TestWrapper>
          <AIGeneratedContent>
            <div>Test content</div>
          </AIGeneratedContent>
        </TestWrapper>
      );
      
      expect(screen.getByText('AI Generated Content')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('displays confidence score when provided', () => {
      render(
        <TestWrapper>
          <AIGeneratedContent confidence={85}>
            <div>Test content</div>
          </AIGeneratedContent>
        </TestWrapper>
      );
      
      expect(screen.getByText('85% confidence')).toBeInTheDocument();
    });

    it('handles feedback interaction', async () => {
      const mockFeedback = jest.fn();
      
      render(
        <TestWrapper>
          <AIGeneratedContent onFeedback={mockFeedback}>
            <div>Test content</div>
          </AIGeneratedContent>
        </TestWrapper>
      );
      
      const thumbsUp = screen.getByLabelText('Positive feedback');
      fireEvent.click(thumbsUp);
      
      await waitFor(() => {
        expect(mockFeedback).toHaveBeenCalledWith({
          type: 'positive',
          timestamp: expect.any(Date),
        });
      });
    });
  });

  describe('ConfidenceIndicator', () => {
    it('renders linear progress by default', () => {
      render(
        <TestWrapper>
          <ConfidenceIndicator confidence={75} />
        </TestWrapper>
      );
      
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders circular progress when specified', () => {
      render(
        <TestWrapper>
          <ConfidenceIndicator confidence={60} variant="circular" />
        </TestWrapper>
      );
      
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows color-coded confidence levels', () => {
      const { rerender } = render(
        <TestWrapper>
          <ConfidenceIndicator confidence={90} colorCoded />
        </TestWrapper>
      );
      
      expect(screen.getByText('high')).toBeInTheDocument();
      
      rerender(
        <TestWrapper>
          <ConfidenceIndicator confidence={70} colorCoded />
        </TestWrapper>
      );
      
      expect(screen.getByText('medium')).toBeInTheDocument();
      
      rerender(
        <TestWrapper>
          <ConfidenceIndicator confidence={50} colorCoded />
        </TestWrapper>
      );
      
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('hides numerical score when showNumericalScore is false', () => {
      render(
        <TestWrapper>
          <ConfidenceIndicator confidence={75} showNumericalScore={false} />
        </TestWrapper>
      );
      
      expect(screen.queryByText('75%')).not.toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows tooltip with explanation when enabled', async () => {
      render(
        <TestWrapper>
          <ConfidenceIndicator 
            confidence={85} 
            showTooltip 
            explanation="Custom explanation for this confidence score"
          />
        </TestWrapper>
      );
      
      const indicator = screen.getByText('85%').closest('div');
      fireEvent.mouseEnter(indicator!);
      
      await waitFor(() => {
        expect(screen.getByText('Confidence Score Explanation')).toBeInTheDocument();
        expect(screen.getByText('Custom explanation for this confidence score')).toBeInTheDocument();
      });
    });

    it('shows default explanation when tooltip enabled without custom explanation', async () => {
      render(
        <TestWrapper>
          <ConfidenceIndicator confidence={85} showTooltip />
        </TestWrapper>
      );
      
      const indicator = screen.getByText('85%').closest('div');
      fireEvent.mouseEnter(indicator!);
      
      await waitFor(() => {
        expect(screen.getByText(/high confidence level/)).toBeInTheDocument();
      });
    });

    it('applies correct colors for different confidence levels', () => {
      const { rerender } = render(
        <TestWrapper>
          <ConfidenceIndicator confidence={90} colorCoded />
        </TestWrapper>
      );
      
      // High confidence should show green
      expect(screen.getByText('90%')).toHaveStyle({ color: 'rgb(76, 175, 80)' });
      
      rerender(
        <TestWrapper>
          <ConfidenceIndicator confidence={70} colorCoded />
        </TestWrapper>
      );
      
      // Medium confidence should show orange
      expect(screen.getByText('70%')).toHaveStyle({ color: 'rgb(255, 152, 0)' });
      
      rerender(
        <TestWrapper>
          <ConfidenceIndicator confidence={40} colorCoded />
        </TestWrapper>
      );
      
      // Low confidence should show red
      expect(screen.getByText('40%')).toHaveStyle({ color: 'rgb(244, 67, 54)' });
    });
  });

  describe('SuggestionChip', () => {
    it('renders with label', () => {
      render(
        <TestWrapper>
          <SuggestionChip label="Test Suggestion" />
        </TestWrapper>
      );
      
      expect(screen.getByText('Test Suggestion')).toBeInTheDocument();
    });

    it('includes confidence in label when provided', () => {
      render(
        <TestWrapper>
          <SuggestionChip label="Test Suggestion" confidence={80} />
        </TestWrapper>
      );
      
      expect(screen.getByText('Test Suggestion (80%)')).toBeInTheDocument();
    });

    it('shows feedback button when enabled', () => {
      render(
        <TestWrapper>
          <SuggestionChip 
            label="Test Suggestion" 
            showFeedback 
            onFeedback={jest.fn()} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText('Provide feedback')).toBeInTheDocument();
    });
  });

  describe('ExplanationTooltip', () => {
    it('renders with string content', async () => {
      render(
        <TestWrapper>
          <ExplanationTooltip title="Test Title" content="Test explanation">
            <button>Hover me</button>
          </ExplanationTooltip>
        </TestWrapper>
      );
      
      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);
      
      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test explanation')).toBeInTheDocument();
      });
    });
  });

  describe('LoadingStateIndicator', () => {
    it('renders spinner variant by default', () => {
      render(
        <TestWrapper>
          <LoadingStateIndicator message="Loading..." />
        </TestWrapper>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders progress variant', () => {
      render(
        <TestWrapper>
          <LoadingStateIndicator 
            variant="progress" 
            message="Processing..." 
            progress={50} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('renders skeleton variant', () => {
      render(
        <TestWrapper>
          <LoadingStateIndicator variant="skeleton" message="Loading content..." />
        </TestWrapper>
      );
      
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('shows estimated time when provided', () => {
      render(
        <TestWrapper>
          <LoadingStateIndicator message="Processing..." estimatedTime={120} />
        </TestWrapper>
      );
      
      expect(screen.getByText(/~2m/)).toBeInTheDocument();
    });
  });
});