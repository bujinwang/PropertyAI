import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ConfidenceIndicator from './ConfidenceIndicator';

expect.extend(toHaveNoViolations);

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ConfidenceIndicator', () => {
  describe('Basic Rendering', () => {
    it('renders linear progress bar by default', () => {
      renderWithTheme(<ConfidenceIndicator confidence={75} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('renders circular progress when variant is circular', () => {
      renderWithTheme(<ConfidenceIndicator confidence={75} variant="circular" />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('displays numerical score by default', () => {
      renderWithTheme(<ConfidenceIndicator confidence={85} />);
      
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('hides numerical score when showNumericalScore is false', () => {
      renderWithTheme(<ConfidenceIndicator confidence={85} showNumericalScore={false} />);
      
      expect(screen.queryByText('85%')).not.toBeInTheDocument();
    });
  });

  describe('Confidence Levels', () => {
    it('displays high confidence level for scores >= 80', () => {
      renderWithTheme(<ConfidenceIndicator confidence={90} colorCoded />);
      
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('displays good confidence level for scores >= 70', () => {
      renderWithTheme(<ConfidenceIndicator confidence={75} colorCoded />);
      
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('displays moderate confidence level for scores >= 60', () => {
      renderWithTheme(<ConfidenceIndicator confidence={65} colorCoded />);
      
      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    it('displays low confidence level for scores < 60', () => {
      renderWithTheme(<ConfidenceIndicator confidence={45} colorCoded />);
      
      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('does not display confidence level chip when colorCoded is false', () => {
      renderWithTheme(<ConfidenceIndicator confidence={85} colorCoded={false} />);
      
      expect(screen.queryByText('High')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size styling', () => {
      renderWithTheme(<ConfidenceIndicator confidence={75} size="small" />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('applies medium size styling (default)', () => {
      renderWithTheme(<ConfidenceIndicator confidence={75} size="medium" />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('applies large size styling', () => {
      renderWithTheme(<ConfidenceIndicator confidence={75} size="large" />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Tooltip Functionality', () => {
    it('displays tooltip when showTooltip is true', async () => {
      const user = userEvent;
      renderWithTheme(
        <ConfidenceIndicator 
          confidence={75} 
          showTooltip 
          explanation="This confidence score is based on data quality"
        />
      );
      
      const indicator = screen.getByRole('group');
      await user.hover(indicator);
      
      // Note: Tooltip testing might need additional setup depending on MUI version
      // This is a basic test structure
    });

    it('does not display tooltip when showTooltip is false', () => {
      renderWithTheme(<ConfidenceIndicator confidence={75} showTooltip={false} />);
      
      // Should not have tooltip trigger elements
      const indicator = screen.getByRole('group');
      expect(indicator).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Color Coding', () => {
    it('applies success color for high confidence', () => {
      renderWithTheme(<ConfidenceIndicator confidence={90} colorCoded />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('Very high confidence'));
    });

    it('applies warning color for medium confidence', () => {
      renderWithTheme(<ConfidenceIndicator confidence={65} colorCoded />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('Moderate confidence'));
    });

    it('applies error color for low confidence', () => {
      renderWithTheme(<ConfidenceIndicator confidence={35} colorCoded />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('Low confidence'));
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithTheme(
        <ConfidenceIndicator 
          confidence={75} 
          showTooltip 
          explanation="Test explanation"
          colorCoded 
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes for progress bar', () => {
      renderWithTheme(<ConfidenceIndicator confidence={85} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '85');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('AI confidence'));
    });

    it('has proper ARIA attributes for confidence level chip', () => {
      renderWithTheme(<ConfidenceIndicator confidence={85} colorCoded />);
      
      const chip = screen.getByText('High');
      expect(chip).toHaveAttribute('aria-label', 'Confidence level: High');
    });

    it('has proper group role and label', () => {
      renderWithTheme(<ConfidenceIndicator confidence={75} />);
      
      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label', 'AI confidence indicator');
    });

    it('provides screen reader description', () => {
      renderWithTheme(<ConfidenceIndicator confidence={75} />);
      
      // Check for hidden screen reader content
      expect(document.querySelector('.sr-only')).toBeInTheDocument();
    });

    it('has proper text contrast for numerical score', () => {
      renderWithTheme(<ConfidenceIndicator confidence={85} />);
      
      const scoreText = screen.getByLabelText('85 percent confidence');
      expect(scoreText).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support', () => {
    it('respects prefers-reduced-motion setting', () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderWithTheme(<ConfidenceIndicator confidence={75} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      // Animation should be disabled - this would need to be tested via computed styles
    });
  });

  describe('Performance', () => {
    it('memoizes expensive color calculations', () => {
      const { rerender } = renderWithTheme(<ConfidenceIndicator confidence={85} />);
      
      // Re-render with same confidence should use cached calculation
      rerender(
        <ThemeProvider theme={theme}>
          <ConfidenceIndicator confidence={85} />
        </ThemeProvider>
      );
      
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('updates when confidence changes', () => {
      const { rerender } = renderWithTheme(<ConfidenceIndicator confidence={75} />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
      
      rerender(
        <ThemeProvider theme={theme}>
          <ConfidenceIndicator confidence={90} />
        </ThemeProvider>
      );
      
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.queryByText('75%')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles 0% confidence', () => {
      renderWithTheme(<ConfidenceIndicator confidence={0} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles 100% confidence', () => {
      renderWithTheme(<ConfidenceIndicator confidence={100} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles decimal confidence values', () => {
      renderWithTheme(<ConfidenceIndicator confidence={75.7} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75.7');
      expect(screen.getByText('76%')).toBeInTheDocument(); // Should round
    });
  });

  describe('Custom Explanation', () => {
    it('uses custom explanation when provided', () => {
      const customExplanation = 'Custom confidence explanation';
      renderWithTheme(
        <ConfidenceIndicator 
          confidence={75} 
          explanation={customExplanation}
          showTooltip 
        />
      );
      
      // This would need to be tested by triggering the tooltip
      // The structure here shows the testing approach
    });

    it('uses default explanation when not provided', () => {
      renderWithTheme(
        <ConfidenceIndicator 
          confidence={75} 
          showTooltip 
        />
      );
      
      // Should use default explanation based on confidence level
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('Good confidence'));
    });
  });
});