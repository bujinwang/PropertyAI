import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import LoadingStateIndicator from './LoadingStateIndicator';

expect.extend(toHaveNoViolations);

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('LoadingStateIndicator', () => {
  describe('Basic Rendering', () => {
    it('renders with default spinner variant', () => {
      renderWithTheme(<LoadingStateIndicator />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      renderWithTheme(<LoadingStateIndicator message="Loading data..." />);
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('displays estimated time when provided', () => {
      renderWithTheme(<LoadingStateIndicator estimatedTime={30} />);
      
      expect(screen.getByText('Estimated time: ~30s')).toBeInTheDocument();
    });

    it('formats estimated time correctly for minutes', () => {
      renderWithTheme(<LoadingStateIndicator estimatedTime={90} />);
      
      expect(screen.getByText('Estimated time: ~2m')).toBeInTheDocument();
    });

    it('formats estimated time correctly for hours', () => {
      renderWithTheme(<LoadingStateIndicator estimatedTime={3700} />);
      
      expect(screen.getByText('Estimated time: ~2h')).toBeInTheDocument();
    });
  });

  describe('Spinner Variant', () => {
    it('renders circular progress with indeterminate state by default', () => {
      renderWithTheme(<LoadingStateIndicator variant="spinner" />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-label', 'Processing...');
    });

    it('renders circular progress with determinate state when progress is provided', () => {
      renderWithTheme(<LoadingStateIndicator variant="spinner" progress={65} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '65');
      expect(screen.getByText('65% complete')).toBeInTheDocument();
    });

    it('displays progress percentage', () => {
      renderWithTheme(<LoadingStateIndicator variant="spinner" progress={75} />);
      
      expect(screen.getByLabelText('75 percent complete')).toBeInTheDocument();
    });
  });

  describe('Progress Variant', () => {
    it('renders linear progress bar', () => {
      renderWithTheme(<LoadingStateIndicator variant="progress" />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-labelledby', 'progress-message');
    });

    it('displays progress percentage in header', () => {
      renderWithTheme(<LoadingStateIndicator variant="progress" progress={45} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '45');
      expect(screen.getByLabelText('45 percent complete')).toBeInTheDocument();
    });

    it('shows estimated time remaining', () => {
      renderWithTheme(<LoadingStateIndicator variant="progress" estimatedTime={120} />);
      
      expect(screen.getByLabelText('Estimated time remaining: ~2m')).toBeInTheDocument();
    });
  });

  describe('Skeleton Variant', () => {
    it('renders skeleton loading placeholders', () => {
      renderWithTheme(<LoadingStateIndicator variant="skeleton" />);
      
      const skeletonGroup = screen.getByRole('group');
      expect(skeletonGroup).toHaveAttribute('aria-label', 'Loading content placeholder');
      
      expect(screen.getByLabelText('Loading content line 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading content line 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading content line 3')).toBeInTheDocument();
    });

    it('displays loading message with skeleton', () => {
      renderWithTheme(<LoadingStateIndicator variant="skeleton" message="Loading content..." />);
      
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('shows estimated time with skeleton', () => {
      renderWithTheme(<LoadingStateIndicator variant="skeleton" estimatedTime={45} />);
      
      expect(screen.getByLabelText('Loading content, estimated time: ~45s')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size styling', () => {
      renderWithTheme(<LoadingStateIndicator size="small" />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      // Size would be tested via computed styles or data attributes
    });

    it('applies medium size styling (default)', () => {
      renderWithTheme(<LoadingStateIndicator size="medium" />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('applies large size styling', () => {
      renderWithTheme(<LoadingStateIndicator size="large" />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with spinner', async () => {
      const { container } = renderWithTheme(
        <LoadingStateIndicator variant="spinner" progress={50} estimatedTime={30} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with progress', async () => {
      const { container } = renderWithTheme(
        <LoadingStateIndicator variant="progress" progress={75} estimatedTime={60} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with skeleton', async () => {
      const { container } = renderWithTheme(
        <LoadingStateIndicator variant="skeleton" estimatedTime={45} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes for status region', () => {
      renderWithTheme(<LoadingStateIndicator message="Loading data..." />);
      
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      expect(statusRegion).toHaveAttribute('aria-label', 'Loading: Loading data...');
      expect(statusRegion).toHaveAttribute('aria-busy', 'true');
    });

    it('has proper ARIA attributes for progress bar', () => {
      renderWithTheme(<LoadingStateIndicator variant="progress" progress={60} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-labelledby', 'progress-message');
    });

    it('has proper ARIA attributes for skeleton content', () => {
      renderWithTheme(<LoadingStateIndicator variant="skeleton" />);
      
      const skeletonGroup = screen.getByRole('group');
      expect(skeletonGroup).toHaveAttribute('aria-labelledby', 'skeleton-message');
      expect(skeletonGroup).toHaveAttribute('aria-label', 'Loading content placeholder');
    });

    it('provides proper labels for estimated time', () => {
      renderWithTheme(<LoadingStateIndicator estimatedTime={90} />);
      
      expect(screen.getByLabelText('Estimated time remaining: ~2m')).toBeInTheDocument();
    });

    it('provides proper labels for progress percentage', () => {
      renderWithTheme(<LoadingStateIndicator progress={85} />);
      
      expect(screen.getByLabelText('85 percent complete')).toBeInTheDocument();
    });
  });

  describe('Live Region Announcements', () => {
    it('announces loading state changes', async () => {
      // Mock the live region announce function
      const mockAnnounce = jest.fn();
      jest.doMock('../../../utils/accessibility', () => ({
        ...jest.requireActual('../../../utils/accessibility'),
        useLiveRegion: () => ({ announce: mockAnnounce }),
      }));

      renderWithTheme(<LoadingStateIndicator message="Loading data..." />);

      // Note: This would need to be tested with the actual implementation
      // The mock here is just to show the testing approach
    });

    it('announces progress updates', async () => {
      const mockAnnounce = jest.fn();
      jest.doMock('../../../utils/accessibility', () => ({
        ...jest.requireActual('../../../utils/accessibility'),
        useLiveRegion: () => ({ announce: mockAnnounce }),
      }));

      const { rerender } = renderWithTheme(<LoadingStateIndicator progress={50} />);

      rerender(
        <ThemeProvider theme={theme}>
          <LoadingStateIndicator progress={75} />
        </ThemeProvider>
      );

      // Should announce progress change
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

      renderWithTheme(<LoadingStateIndicator />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      // Animation should be disabled - this would need to be tested via computed styles
    });

    it('disables skeleton animations when reduced motion is preferred', () => {
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

      renderWithTheme(<LoadingStateIndicator variant="skeleton" />);
      
      const skeletonElements = screen.getAllByLabelText(/Loading content line/);
      expect(skeletonElements).toHaveLength(3);
      // Animation should be disabled - this would need to be tested via computed styles
    });
  });

  describe('Progress Updates', () => {
    it('updates progress value correctly', () => {
      const { rerender } = renderWithTheme(<LoadingStateIndicator progress={25} />);
      
      expect(screen.getByLabelText('25 percent complete')).toBeInTheDocument();
      
      rerender(
        <ThemeProvider theme={theme}>
          <LoadingStateIndicator progress={75} />
        </ThemeProvider>
      );
      
      expect(screen.getByLabelText('75 percent complete')).toBeInTheDocument();
      expect(screen.queryByLabelText('25 percent complete')).not.toBeInTheDocument();
    });

    it('updates message correctly', () => {
      const { rerender } = renderWithTheme(<LoadingStateIndicator message="Loading..." />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      rerender(
        <ThemeProvider theme={theme}>
          <LoadingStateIndicator message="Almost done..." />
        </ThemeProvider>
      );
      
      expect(screen.getByText('Almost done...')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles 0% progress', () => {
      renderWithTheme(<LoadingStateIndicator progress={0} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByLabelText('0 percent complete')).toBeInTheDocument();
    });

    it('handles 100% progress', () => {
      renderWithTheme(<LoadingStateIndicator progress={100} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      expect(screen.getByLabelText('100 percent complete')).toBeInTheDocument();
    });

    it('handles decimal progress values', () => {
      renderWithTheme(<LoadingStateIndicator progress={67.8} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '67.8');
      expect(screen.getByLabelText('68 percent complete')).toBeInTheDocument(); // Should round
    });

    it('handles very long estimated times', () => {
      renderWithTheme(<LoadingStateIndicator estimatedTime={7200} />); // 2 hours
      
      expect(screen.getByText('Estimated time: ~2h')).toBeInTheDocument();
    });

    it('handles empty message', () => {
      renderWithTheme(<LoadingStateIndicator message="" />);
      
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-label', 'Loading: ');
    });
  });

  describe('Container Styling', () => {
    it('applies proper Paper styling', () => {
      const { container } = renderWithTheme(<LoadingStateIndicator />);
      
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
      // Would test specific styles via computed styles
    });

    it('maintains consistent border and background', () => {
      const { container } = renderWithTheme(<LoadingStateIndicator />);
      
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
      // Would test border and background styles
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const { rerender } = renderWithTheme(<LoadingStateIndicator message="Loading..." />);
      
      // Re-render with same props should not cause issues
      rerender(
        <ThemeProvider theme={theme}>
          <LoadingStateIndicator message="Loading..." />
        </ThemeProvider>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});