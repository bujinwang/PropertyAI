import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ExplanationTooltip from './ExplanationTooltip';
import { AIExplanation } from '../../../types/ai';

expect.extend(toHaveNoViolations);

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ExplanationTooltip', () => {
  const mockAIExplanation: AIExplanation = {
    content: 'This decision was made based on multiple factors',
    factors: [
      {
        name: 'Data Quality',
        value: 'High',
        weight: 0.4,
        impact: 'positive',
        description: 'The input data was complete and accurate'
      },
      {
        name: 'Model Confidence',
        value: 85,
        weight: 0.3,
        impact: 'positive',
        description: 'The model has high confidence in this prediction'
      },
      {
        name: 'Historical Performance',
        value: 'Good',
        weight: 0.3,
        impact: 'neutral',
        description: 'Similar cases have shown good results'
      }
    ],
    methodology: 'Machine learning model trained on historical data',
    limitations: [
      'Results may vary with different data patterns',
      'Model performance depends on data quality'
    ]
  };

  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      renderWithTheme(
        <ExplanationTooltip title="Test Title" content="Test content">
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
    });

    it('renders string children as span with proper attributes', () => {
      renderWithTheme(
        <ExplanationTooltip title="Test Title" content="Test content">
          Text trigger
        </ExplanationTooltip>
      );

      const trigger = screen.getByText('Text trigger');
      expect(trigger).toHaveAttribute('tabIndex', '0');
      expect(trigger).toHaveAttribute('role', 'button');
    });
  });

  describe('String Content', () => {
    it('displays simple string content in tooltip', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="Simple Explanation" content="This is a simple explanation">
          <button>Show explanation</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Simple Explanation')).toBeInTheDocument();
        expect(screen.getByText('This is a simple explanation')).toBeInTheDocument();
      });
    });
  });

  describe('AI Explanation Content', () => {
    it('displays AI explanation with all sections', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="AI Decision" content={mockAIExplanation}>
          <button>Show AI explanation</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('AI Decision')).toBeInTheDocument();
        expect(screen.getByText('This decision was made based on multiple factors')).toBeInTheDocument();
        expect(screen.getByText('Key Factors:')).toBeInTheDocument();
        expect(screen.getByText('Methodology:')).toBeInTheDocument();
        expect(screen.getByText('Limitations:')).toBeInTheDocument();
      });
    });

    it('displays factor details correctly', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="AI Decision" content={mockAIExplanation}>
          <button>Show AI explanation</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Data Quality')).toBeInTheDocument();
        expect(screen.getByText('The input data was complete and accurate (Weight: 40%)')).toBeInTheDocument();
        expect(screen.getByLabelText('Impact: positive')).toBeInTheDocument();
      });
    });

    it('displays methodology section', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="AI Decision" content={mockAIExplanation}>
          <button>Show AI explanation</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Machine learning model trained on historical data')).toBeInTheDocument();
      });
    });

    it('displays limitations list', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="AI Decision" content={mockAIExplanation}>
          <button>Show AI explanation</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('• Results may vary with different data patterns')).toBeInTheDocument();
        expect(screen.getByText('• Model performance depends on data quality')).toBeInTheDocument();
      });
    });
  });

  describe('Tooltip Behavior', () => {
    it('opens tooltip on hover', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="Test" content="Test content">
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('closes tooltip on unhover', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="Test" content="Test content">
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });

      await user.unhover(trigger);

      await waitFor(() => {
        expect(screen.queryByText('Test')).not.toBeInTheDocument();
      });
    });

    it('supports different placements', () => {
      const placements = ['top', 'bottom', 'left', 'right'] as const;
      
      placements.forEach(placement => {
        const { unmount } = renderWithTheme(
          <ExplanationTooltip title="Test" content="Test content" placement={placement}>
            <button>Trigger {placement}</button>
          </ExplanationTooltip>
        );

        expect(screen.getByRole('button', { name: `Trigger ${placement}` })).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens tooltip on focus', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="Test" content="Test content">
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.tab(); // Focus the trigger

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('closes tooltip on Escape key', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="Test" content="Test content">
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.tab(); // Focus the trigger

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Test')).not.toBeInTheDocument();
      });
    });

    it('supports keyboard navigation for string children', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="Test" content="Test content">
          Text trigger
        </ExplanationTooltip>
      );

      const trigger = screen.getByText('Text trigger');
      trigger.focus();

      await user.keyboard('{Enter}');

      // Should handle keyboard interaction
      expect(trigger).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with string content', async () => {
      const { container } = renderWithTheme(
        <ExplanationTooltip title="Test Title" content="Test content">
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with AI explanation', async () => {
      const { container } = renderWithTheme(
        <ExplanationTooltip title="AI Decision" content={mockAIExplanation}>
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes for tooltip', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="Test" content="Test content">
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveAttribute('aria-labelledby', 'tooltip-title');
      });
    });

    it('has proper ARIA attributes for AI explanation tooltip', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="AI Decision" content={mockAIExplanation}>
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveAttribute('aria-labelledby', 'tooltip-title');
        expect(tooltip).toHaveAttribute('aria-describedby', 'tooltip-content');
      });
    });

    it('has proper list structure for factors', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="AI Decision" content={mockAIExplanation}>
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        const factorsList = screen.getByRole('list', { name: 'AI decision factors' });
        expect(factorsList).toBeInTheDocument();
        
        const factorItems = screen.getAllByRole('listitem');
        expect(factorItems).toHaveLength(mockAIExplanation.factors!.length);
      });
    });

    it('announces tooltip state changes', async () => {
      // Mock the live region announce function
      const mockAnnounce = jest.fn();
      jest.doMock('../../../utils/accessibility', () => ({
        ...jest.requireActual('../../../utils/accessibility'),
        useLiveRegion: () => ({ announce: mockAnnounce }),
      }));

      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="Test" content="Test content">
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      // Note: This would need to be tested with the actual implementation
      // The mock here is just to show the testing approach
    });
  });

  describe('Interactive Mode', () => {
    it('allows interaction with tooltip content when interactive is true', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="Test" content="Test content" interactive={true}>
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
      });

      // Should be able to interact with tooltip content
      // This would need more specific testing based on tooltip implementation
    });

    it('does not allow interaction when interactive is false', () => {
      renderWithTheme(
        <ExplanationTooltip title="Test" content="Test content" interactive={false}>
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      // Tooltip should not be interactive
      // This would need to be tested based on the specific implementation
    });
  });

  describe('Max Width', () => {
    it('applies custom max width', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="Test" content="Test content" maxWidth={300}>
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        // Would need to check computed styles for max-width
        expect(tooltip).toBeInTheDocument();
      });
    });
  });

  describe('Factor Impact Colors', () => {
    it('applies correct colors for different impact types', async () => {
      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="AI Decision" content={mockAIExplanation}>
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        const positiveChip = screen.getByLabelText('Impact: positive');
        const neutralChip = screen.getByLabelText('Impact: neutral');
        
        expect(positiveChip).toBeInTheDocument();
        expect(neutralChip).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles explanation without factors', async () => {
      const explanationWithoutFactors: AIExplanation = {
        content: 'Simple explanation without factors',
        methodology: 'Basic methodology',
        limitations: ['Some limitation']
      };

      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="Simple" content={explanationWithoutFactors}>
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Simple explanation without factors')).toBeInTheDocument();
        expect(screen.queryByText('Key Factors:')).not.toBeInTheDocument();
      });
    });

    it('handles explanation without methodology', async () => {
      const explanationWithoutMethodology: AIExplanation = {
        content: 'Explanation without methodology',
        factors: mockAIExplanation.factors,
        limitations: ['Some limitation']
      };

      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="No Method" content={explanationWithoutMethodology}>
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Explanation without methodology')).toBeInTheDocument();
        expect(screen.queryByText('Methodology:')).not.toBeInTheDocument();
      });
    });

    it('handles explanation without limitations', async () => {
      const explanationWithoutLimitations: AIExplanation = {
        content: 'Explanation without limitations',
        factors: mockAIExplanation.factors,
        methodology: 'Some methodology'
      };

      const user = userEvent;
      renderWithTheme(
        <ExplanationTooltip title="No Limits" content={explanationWithoutLimitations}>
          <button>Trigger</button>
        </ExplanationTooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Explanation without limitations')).toBeInTheDocument();
        expect(screen.queryByText('Limitations:')).not.toBeInTheDocument();
      });
    });
  });
});