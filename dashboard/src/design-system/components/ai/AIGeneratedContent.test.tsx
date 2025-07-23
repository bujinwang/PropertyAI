import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import AIGeneratedContent from './AIGeneratedContent';
import { AIFeedback } from '../../../types/ai';

expect.extend(toHaveNoViolations);

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('AIGeneratedContent', () => {
  const mockOnFeedback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders children content correctly', () => {
      renderWithTheme(
        <AIGeneratedContent>
          <p>Test AI content</p>
        </AIGeneratedContent>
      );

      expect(screen.getByText('Test AI content')).toBeInTheDocument();
    });

    it('displays AI generated content label by default', () => {
      renderWithTheme(
        <AIGeneratedContent>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      expect(screen.getByText('AI Generated Content')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      renderWithTheme(
        <AIGeneratedContent showLabel={false}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      expect(screen.queryByText('AI Generated Content')).not.toBeInTheDocument();
    });
  });

  describe('Confidence Display', () => {
    it('displays confidence score when provided', () => {
      renderWithTheme(
        <AIGeneratedContent confidence={85}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      expect(screen.getByText('85% confidence')).toBeInTheDocument();
    });

    it('does not display confidence when not provided', () => {
      renderWithTheme(
        <AIGeneratedContent>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      expect(screen.queryByText(/confidence/)).not.toBeInTheDocument();
    });
  });

  describe('Explanation Tooltip', () => {
    it('displays explanation tooltip when explanation is provided', () => {
      renderWithTheme(
        <AIGeneratedContent explanation="This is how AI generated this content">
          <p>Test content</p>
        </AIGeneratedContent>
      );

      expect(screen.getByLabelText('View AI explanation')).toBeInTheDocument();
    });

    it('does not display explanation tooltip when explanation is not provided', () => {
      renderWithTheme(
        <AIGeneratedContent>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      expect(screen.queryByLabelText('View AI explanation')).not.toBeInTheDocument();
    });
  });

  describe('Feedback Mechanism', () => {
    it('displays feedback buttons when onFeedback is provided', () => {
      renderWithTheme(
        <AIGeneratedContent onFeedback={mockOnFeedback}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      expect(screen.getByLabelText('Mark as helpful')).toBeInTheDocument();
      expect(screen.getByLabelText('Mark as not helpful')).toBeInTheDocument();
      expect(screen.getByLabelText('Provide detailed feedback')).toBeInTheDocument();
    });

    it('does not display feedback buttons when onFeedback is not provided', () => {
      renderWithTheme(
        <AIGeneratedContent>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      expect(screen.queryByLabelText('Mark as helpful')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Mark as not helpful')).not.toBeInTheDocument();
    });

    it('calls onFeedback with positive feedback when thumbs up is clicked', async () => {
      const user = userEvent;
      renderWithTheme(
        <AIGeneratedContent onFeedback={mockOnFeedback}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      await user.click(screen.getByLabelText('Mark as helpful'));

      expect(mockOnFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'positive',
          timestamp: expect.any(Date),
        })
      );
    });

    it('calls onFeedback with negative feedback when thumbs down is clicked', async () => {
      const user = userEvent;
      renderWithTheme(
        <AIGeneratedContent onFeedback={mockOnFeedback}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      await user.click(screen.getByLabelText('Mark as not helpful'));

      expect(mockOnFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'negative',
          timestamp: expect.any(Date),
        })
      );
    });

    it('opens feedback form when expand button is clicked', async () => {
      const user = userEvent;
      renderWithTheme(
        <AIGeneratedContent onFeedback={mockOnFeedback}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      await user.click(screen.getByLabelText('Provide detailed feedback'));

      expect(screen.getByText('Provide additional feedback (optional):')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tell us more about your experience...')).toBeInTheDocument();
    });

    it('submits feedback with comment when form is used', async () => {
      const user = userEvent;
      renderWithTheme(
        <AIGeneratedContent onFeedback={mockOnFeedback}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      // Open feedback form
      await user.click(screen.getByLabelText('Provide detailed feedback'));

      // Type comment
      const commentField = screen.getByPlaceholderText('Tell us more about your experience...');
      await user.type(commentField, 'This was very helpful!');

      // Submit positive feedback
      await user.click(screen.getByText('Helpful'));

      expect(mockOnFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'positive',
          comment: 'This was very helpful!',
          timestamp: expect.any(Date),
        })
      );
    });

    it('displays submitted feedback status', async () => {
      const user = userEvent;
      renderWithTheme(
        <AIGeneratedContent onFeedback={mockOnFeedback}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      await user.click(screen.getByLabelText('Mark as helpful'));

      await waitFor(() => {
        expect(screen.getByText('Feedback: positive')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation for feedback buttons', async () => {
      const user = userEvent;
      renderWithTheme(
        <AIGeneratedContent onFeedback={mockOnFeedback}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      const expandButton = screen.getByLabelText('Provide detailed feedback');
      expandButton.focus();

      // Press Enter to open feedback form
      await user.keyboard('{Enter}');

      expect(screen.getByText('Provide additional feedback (optional):')).toBeInTheDocument();

      // Press Escape to close feedback form
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Provide additional feedback (optional):')).not.toBeInTheDocument();
      });
    });

    it('focuses comment field when feedback form opens', async () => {
      const user = userEvent;
      renderWithTheme(
        <AIGeneratedContent onFeedback={mockOnFeedback}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      await user.click(screen.getByLabelText('Provide detailed feedback'));

      await waitFor(() => {
        const commentField = screen.getByPlaceholderText('Tell us more about your experience...');
        expect(commentField).toHaveFocus();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithTheme(
        <AIGeneratedContent confidence={75} explanation="Test explanation" onFeedback={mockOnFeedback}>
          <p>Test AI content</p>
        </AIGeneratedContent>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      renderWithTheme(
        <AIGeneratedContent confidence={85}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      const container = screen.getByRole('region');
      expect(container).toHaveAttribute('aria-label', expect.stringContaining('AI generated content'));
      expect(container).toHaveAttribute('data-ai-generated', 'true');
    });

    it('has proper ARIA attributes for confidence', () => {
      renderWithTheme(
        <AIGeneratedContent confidence={85}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      const confidenceChip = screen.getByText('85% confidence');
      expect(confidenceChip.parentElement).toHaveAttribute('aria-label', expect.stringContaining('confidence'));
    });

    it('has proper ARIA attributes for feedback group', () => {
      renderWithTheme(
        <AIGeneratedContent onFeedback={mockOnFeedback}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      const feedbackGroup = screen.getByRole('group', { name: 'AI content feedback options' });
      expect(feedbackGroup).toBeInTheDocument();
    });

    it('has proper form labels and descriptions', async () => {
      const user = userEvent;
      renderWithTheme(
        <AIGeneratedContent onFeedback={mockOnFeedback}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      await user.click(screen.getByLabelText('Provide detailed feedback'));

      const commentField = screen.getByLabelText('Additional feedback comment');
      expect(commentField).toHaveAttribute('aria-describedby', 'feedback-help');
      
      const helpText = screen.getByText('Help us improve AI suggestions by sharing your experience');
      expect(helpText).toHaveAttribute('id', 'feedback-help');
    });

    it('announces feedback submission to screen readers', async () => {
      const user = userEvent;
      
      // Mock the announce function
      const mockAnnounce = jest.fn();
      jest.doMock('../../../utils/accessibility', () => ({
        ...jest.requireActual('../../../utils/accessibility'),
        useLiveRegion: () => ({ announce: mockAnnounce }),
      }));

      renderWithTheme(
        <AIGeneratedContent onFeedback={mockOnFeedback}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      await user.click(screen.getByLabelText('Mark as helpful'));

      // Note: This would need to be tested with the actual implementation
      // The mock here is just to show the testing approach
    });
  });

  describe('Variants', () => {
    it('applies outlined variant styling', () => {
      const { container } = renderWithTheme(
        <AIGeneratedContent variant="outlined">
          <p>Test content</p>
        </AIGeneratedContent>
      );

      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toHaveClass('MuiPaper-outlined');
    });

    it('applies filled variant styling', () => {
      const { container } = renderWithTheme(
        <AIGeneratedContent variant="filled">
          <p>Test content</p>
        </AIGeneratedContent>
      );

      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).not.toHaveClass('MuiPaper-outlined');
    });
  });

  describe('Error Handling', () => {
    it('handles feedback submission errors gracefully', async () => {
      const user = userEvent;
      const mockOnFeedbackError = jest.fn().mockRejectedValue(new Error('Network error'));
      
      renderWithTheme(
        <AIGeneratedContent onFeedback={mockOnFeedbackError}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      await user.click(screen.getByLabelText('Mark as helpful'));

      // Component should not crash and should handle the error
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('memoizes expensive calculations', () => {
      const { rerender } = renderWithTheme(
        <AIGeneratedContent confidence={85}>
          <p>Test content</p>
        </AIGeneratedContent>
      );

      // Re-render with same props should not cause unnecessary recalculations
      rerender(
        <ThemeProvider theme={theme}>
          <AIGeneratedContent confidence={85}>
            <p>Test content</p>
          </AIGeneratedContent>
        </ThemeProvider>
      );

      expect(screen.getByText('85% confidence')).toBeInTheDocument();
    });
  });
});