/**
 * Integration tests for AI Components
 * Tests component interactions and API integrations
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme, testAccessibility, mockServices } from '../../../utils/test-utils';
import { AIGeneratedContent } from './AIGeneratedContent';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { SuggestionChip } from './SuggestionChip';
import { ExplanationTooltip } from './ExplanationTooltip';
import { LoadingStateIndicator } from './LoadingStateIndicator';

// Mock the AI service
jest.mock('../../../services/aiService', () => mockServices.aiService);

describe('AI Components Integration', () => {
  const user = userEvent;

  describe('AIGeneratedContent with ConfidenceIndicator', () => {
    it('displays AI content with confidence score and handles feedback', async () => {
      const onFeedback = jest.fn();
      
      renderWithTheme(
        <AIGeneratedContent
          confidence={85}
          onFeedback={onFeedback}
          explanation="Based on historical data analysis"
        >
          <div>
            <p>AI generated property description</p>
            <ConfidenceIndicator value={85} showTooltip />
          </div>
        </AIGeneratedContent>
      );

      // Check AI content is properly identified
      const aiContent = screen.getByTestId('ai-generated-content');
      expect(aiContent).toHaveAttribute('data-ai-generated', 'true');
      expect(aiContent).toHaveAttribute('aria-label', expect.stringContaining('AI generated'));

      // Check confidence indicator
      const confidenceIndicator = screen.getByTestId('confidence-indicator');
      expect(confidenceIndicator).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();

      // Test feedback functionality
      const thumbsUp = screen.getByLabelText(/mark as helpful/i);
      await user.click(thumbsUp);
      
      expect(onFeedback).toHaveBeenCalledWith('positive', undefined);

      // Test accessibility
      await testAccessibility(aiContent);
    });

    it('shows explanation tooltip when confidence is clicked', async () => {
      renderWithTheme(
        <AIGeneratedContent
          confidence={75}
          explanation="Analysis based on 6 months of market data"
        >
          <div>AI market analysis</div>
        </AIGeneratedContent>
      );

      const confidenceIndicator = screen.getByTestId('confidence-indicator');
      await user.hover(confidenceIndicator);

      await waitFor(() => {
        expect(screen.getByText(/analysis based on 6 months/i)).toBeInTheDocument();
      });
    });
  });

  describe('SuggestionChip with Feedback', () => {
    it('handles suggestion approval and rejection', async () => {
      const onApprove = jest.fn();
      const onReject = jest.fn();
      
      renderWithTheme(
        <SuggestionChip
          suggestion="Increase rent by 5% based on market analysis"
          confidence={82}
          onApprove={onApprove}
          onReject={onReject}
          showFeedback
        />
      );

      // Check suggestion is displayed
      expect(screen.getByText(/increase rent by 5%/i)).toBeInTheDocument();
      expect(screen.getByText('82%')).toBeInTheDocument();

      // Test approval
      const approveButton = screen.getByLabelText(/approve suggestion/i);
      await user.click(approveButton);
      expect(onApprove).toHaveBeenCalled();

      // Test rejection
      const rejectButton = screen.getByLabelText(/reject suggestion/i);
      await user.click(rejectButton);
      expect(onReject).toHaveBeenCalled();
    });

    it('allows detailed feedback with comments', async () => {
      const onFeedback = jest.fn();
      
      renderWithTheme(
        <SuggestionChip
          suggestion="Schedule maintenance for HVAC system"
          confidence={90}
          onFeedback={onFeedback}
          showFeedback
          allowComments
        />
      );

      // Click thumbs down to show comment field
      const thumbsDown = screen.getByLabelText(/mark as not helpful/i);
      await user.click(thumbsDown);

      // Should show comment field
      const commentField = await screen.findByPlaceholderText(/tell us why/i);
      expect(commentField).toBeInTheDocument();

      // Enter comment and submit
      await user.type(commentField, 'HVAC was recently serviced');
      
      const submitButton = screen.getByText(/submit feedback/i);
      await user.click(submitButton);

      expect(onFeedback).toHaveBeenCalledWith('negative', 'HVAC was recently serviced');
    });
  });

  describe('ExplanationTooltip Integration', () => {
    it('provides accessible explanations for AI decisions', async () => {
      renderWithTheme(
        <ExplanationTooltip
          title="Risk Assessment Explanation"
          content="This assessment is based on credit score (40%), income verification (30%), and rental history (30%)"
        >
          <button>Risk Score: 75</button>
        </ExplanationTooltip>
      );

      const triggerButton = screen.getByRole('button', { name: /risk score/i });
      
      // Test keyboard accessibility
      triggerButton.focus();
      fireEvent.keyDown(triggerButton, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText(/this assessment is based on/i)).toBeInTheDocument();
      });

      // Test escape key closes tooltip
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByText(/this assessment is based on/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('LoadingStateIndicator with AI Operations', () => {
    it('shows appropriate loading states for different AI operations', async () => {
      const { rerender } = renderWithTheme(
        <LoadingStateIndicator
          message="Analyzing property data..."
          estimatedTime={5}
          variant="spinner"
        />
      );

      expect(screen.getByText(/analyzing property data/i)).toBeInTheDocument();
      expect(screen.getByText(/estimated time: 5 seconds/i)).toBeInTheDocument();

      // Test progress variant
      rerender(
        <LoadingStateIndicator
          message="Processing AI recommendations..."
          estimatedTime={10}
          variant="progress"
          progress={60}
        />
      );

      expect(screen.getByText(/processing ai recommendations/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');

      // Test skeleton variant
      rerender(
        <LoadingStateIndicator
          message="Loading dashboard..."
          variant="skeleton"
        />
      );

      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
    });

    it('announces loading state changes to screen readers', async () => {
      const { rerender } = renderWithTheme(
        <LoadingStateIndicator
          message="Starting analysis..."
          variant="spinner"
        />
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
      expect(loadingElement).toHaveTextContent(/starting analysis/i);

      // Update loading message
      rerender(
        <LoadingStateIndicator
          message="Analysis complete"
          variant="spinner"
        />
      );

      expect(loadingElement).toHaveTextContent(/analysis complete/i);
    });
  });

  describe('Component Composition', () => {
    it('works correctly when multiple AI components are composed together', async () => {
      const TestComposition = () => (
        <div>
          <AIGeneratedContent confidence={88} explanation="Market analysis">
            <div>
              <h3>Property Recommendations</h3>
              <SuggestionChip
                suggestion="Consider upgrading kitchen appliances"
                confidence={85}
                showFeedback
              />
              <SuggestionChip
                suggestion="Schedule deep cleaning before showing"
                confidence={92}
                showFeedback
              />
            </div>
          </AIGeneratedContent>
          
          <ExplanationTooltip
            title="How we calculate recommendations"
            content="Based on market trends, property condition, and tenant feedback"
          >
            <ConfidenceIndicator value={88} showTooltip />
          </ExplanationTooltip>
        </div>
      );

      renderWithTheme(<TestComposition />);

      // Check all components are rendered
      expect(screen.getByTestId('ai-generated-content')).toBeInTheDocument();
      expect(screen.getAllByTestId('suggestion-chip')).toHaveLength(2);
      expect(screen.getByTestId('confidence-indicator')).toBeInTheDocument();

      // Test accessibility of the entire composition
      const container = screen.getByTestId('ai-generated-content').parentElement!;
      await testAccessibility(container);
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      // Mock API failure
      mockServices.aiService.getSuggestions.mockRejectedValueOnce(
        new Error('API Error')
      );

      const onError = jest.fn();
      
      renderWithTheme(
        <AIGeneratedContent
          confidence={0}
          onError={onError}
        >
          <div>Failed to load AI content</div>
        </AIGeneratedContent>
      );

      // Should show error state
      expect(screen.getByText(/failed to load ai content/i)).toBeInTheDocument();
    });

    it('provides fallback content when AI features are unavailable', () => {
      renderWithTheme(
        <AIGeneratedContent
          confidence={0}
          fallback={<div>Manual content available</div>}
        >
          <div>AI content</div>
        </AIGeneratedContent>
      );

      // Should show fallback when confidence is 0
      expect(screen.getByText(/manual content available/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = React.memo(() => {
        renderSpy();
        return (
          <AIGeneratedContent confidence={85}>
            <div>Test content</div>
          </AIGeneratedContent>
        );
      });

      const { rerender } = renderWithTheme(<TestComponent />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props should not cause re-render
      rerender(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});