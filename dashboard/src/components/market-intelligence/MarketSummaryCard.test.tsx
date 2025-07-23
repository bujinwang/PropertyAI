/**
 * MarketSummaryCard Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import MarketSummaryCard from './MarketSummaryCard';
import { AISummary } from '../../types/market-intelligence';
import theme from '../../design-system/theme';

// Mock the AI components
jest.mock('../../design-system/components/ai/AIGeneratedContent', () => {
  return function MockAIGeneratedContent({ children, onFeedback }: any) {
    return (
      <div data-testid="ai-generated-content">
        {children}
        <button onClick={() => onFeedback?.({ type: 'positive', timestamp: new Date() })}>
          Positive Feedback
        </button>
      </div>
    );
  };
});

jest.mock('../../design-system/components/ai/ConfidenceIndicator', () => {
  return function MockConfidenceIndicator({ confidence }: any) {
    return <div data-testid="confidence-indicator">Confidence: {confidence}%</div>;
  };
});

jest.mock('../../design-system/components/ai/ExplanationTooltip', () => {
  return function MockExplanationTooltip({ children, title, content }: any) {
    return (
      <div data-testid="explanation-tooltip" title={`${title}: ${content}`}>
        {children}
      </div>
    );
  };
});

const mockSummary: AISummary = {
  id: 'summary-1',
  title: 'Market Intelligence Summary',
  content: 'Current market conditions show strong rental demand with moderate price growth.',
  confidence: 85,
  timestamp: new Date('2024-01-15T10:00:00Z'),
  explanation: 'Analysis based on 30-day rolling average of market data',
  keyInsights: [
    'Rental demand increased 12% compared to last month',
    'Average rent prices up 3.5% year-over-year',
    'Vacancy rates decreased to 4.2% from 5.1%'
  ],
  marketCondition: 'favorable',
  recommendations: [
    {
      id: 'rec-1',
      title: 'Optimize Pricing Strategy',
      description: 'Consider 2-3% rent increase for renewals based on market trends',
      priority: 'high',
      confidence: { value: 88, level: 'high', explanation: 'Strong market data supports pricing adjustment' },
      category: 'pricing',
      timeline: '30 days',
      expectedOutcome: 'Increased revenue by 2-5% with minimal tenant turnover'
    }
  ],
  riskFactors: [
    'Potential oversupply in luxury segment',
    'Interest rate changes affecting buyer market'
  ],
  opportunities: [
    'Underserved mid-market segment',
    'Growing demand for pet-friendly units'
  ]
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('MarketSummaryCard', () => {
  it('renders market summary with all key information', () => {
    renderWithTheme(<MarketSummaryCard summary={mockSummary} />);

    expect(screen.getByText('Market Intelligence Summary')).toBeInTheDocument();
    expect(screen.getByText('Favorable')).toBeInTheDocument();
    expect(screen.getByText(/Current market conditions show strong rental demand/)).toBeInTheDocument();
    expect(screen.getByTestId('confidence-indicator')).toHaveTextContent('Confidence: 85%');
  });

  it('displays key insights correctly', () => {
    renderWithTheme(<MarketSummaryCard summary={mockSummary} />);

    expect(screen.getByText('Key Insights')).toBeInTheDocument();
    expect(screen.getByText('Rental demand increased 12% compared to last month')).toBeInTheDocument();
    expect(screen.getByText('Average rent prices up 3.5% year-over-year')).toBeInTheDocument();
    expect(screen.getByText('Vacancy rates decreased to 4.2% from 5.1%')).toBeInTheDocument();
  });

  it('shows AI recommendations with expandable details', async () => {
    renderWithTheme(<MarketSummaryCard summary={mockSummary} />);

    expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Optimize Pricing Strategy')).toBeInTheDocument();

    // Click to expand recommendation
    const expandButton = screen.getByRole('button', { name: /expand/i });
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Consider 2-3% rent increase for renewals based on market trends')).toBeInTheDocument();
      expect(screen.getByText('Timeline: 30 days')).toBeInTheDocument();
      expect(screen.getByText(/Expected Outcome:/)).toBeInTheDocument();
    });
  });

  it('displays risk factors and opportunities', () => {
    renderWithTheme(<MarketSummaryCard summary={mockSummary} />);

    expect(screen.getByText('Risk Factors')).toBeInTheDocument();
    expect(screen.getByText('Potential oversupply in luxury segment')).toBeInTheDocument();
    expect(screen.getByText('Interest rate changes affecting buyer market')).toBeInTheDocument();

    expect(screen.getByText('Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Underserved mid-market segment')).toBeInTheDocument();
    expect(screen.getByText('Growing demand for pet-friendly units')).toBeInTheDocument();
  });

  it('handles feedback submission', async () => {
    const mockOnFeedback = jest.fn();
    renderWithTheme(<MarketSummaryCard summary={mockSummary} onFeedback={mockOnFeedback} />);

    const feedbackButton = screen.getByText('Positive Feedback');
    fireEvent.click(feedbackButton);

    await waitFor(() => {
      expect(mockOnFeedback).toHaveBeenCalledWith({
        type: 'positive',
        timestamp: expect.any(Date)
      });
    });
  });

  it('shows loading state', () => {
    renderWithTheme(<MarketSummaryCard summary={mockSummary} loading={true} />);

    expect(screen.getByText('Loading market summary...')).toBeInTheDocument();
  });

  it('displays market condition with appropriate color coding', () => {
    const favorableSummary = { ...mockSummary, marketCondition: 'favorable' as const };
    const challengingSummary = { ...mockSummary, marketCondition: 'challenging' as const };
    const neutralSummary = { ...mockSummary, marketCondition: 'neutral' as const };

    // Test favorable condition
    const { rerender } = renderWithTheme(<MarketSummaryCard summary={favorableSummary} />);
    expect(screen.getByText('Favorable')).toBeInTheDocument();

    // Test challenging condition
    rerender(
      <ThemeProvider theme={theme}>
        <MarketSummaryCard summary={challengingSummary} />
      </ThemeProvider>
    );
    expect(screen.getByText('Challenging')).toBeInTheDocument();

    // Test neutral condition
    rerender(
      <ThemeProvider theme={theme}>
        <MarketSummaryCard summary={neutralSummary} />
      </ThemeProvider>
    );
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('shows explanation tooltip', () => {
    renderWithTheme(<MarketSummaryCard summary={mockSummary} />);

    const explanationButton = screen.getByText('Learn about our analysis methodology');
    expect(explanationButton).toBeInTheDocument();
    
    const tooltip = screen.getByTestId('explanation-tooltip');
    expect(tooltip).toHaveAttribute('title', expect.stringContaining('How is this summary generated?'));
  });

  it('formats timestamp correctly', () => {
    renderWithTheme(<MarketSummaryCard summary={mockSummary} />);

    // Check that the timestamp is displayed (exact format may vary by locale)
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('handles recommendations with different priorities', () => {
    const summaryWithMultiplePriorities = {
      ...mockSummary,
      recommendations: [
        {
          ...mockSummary.recommendations[0],
          priority: 'high' as const
        },
        {
          id: 'rec-2',
          title: 'Medium Priority Recommendation',
          description: 'A medium priority recommendation',
          priority: 'medium' as const,
          confidence: { value: 70, level: 'medium' as const, explanation: 'Medium confidence' },
          category: 'operations' as const,
          timeline: '60 days',
          expectedOutcome: 'Some improvement'
        },
        {
          id: 'rec-3',
          title: 'Low Priority Recommendation',
          description: 'A low priority recommendation',
          priority: 'low' as const,
          confidence: { value: 60, level: 'low' as const, explanation: 'Low confidence' },
          category: 'marketing' as const,
          timeline: '90 days',
          expectedOutcome: 'Minor improvement'
        }
      ]
    };

    renderWithTheme(<MarketSummaryCard summary={summaryWithMultiplePriorities} />);

    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('Medium Priority Recommendation')).toBeInTheDocument();
    expect(screen.getByText('Low Priority Recommendation')).toBeInTheDocument();
  });
});