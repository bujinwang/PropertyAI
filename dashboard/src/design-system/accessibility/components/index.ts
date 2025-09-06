// PropertyFlow AI Accessibility Components
// Reusable components for consistent accessibility patterns

import React, { forwardRef, ReactNode } from 'react';
import { styled } from '@mui/material/styles';

/**
 * VisuallyHidden component for screen reader only content
 * Content is visually hidden but accessible to screen readers
 */
export interface VisuallyHiddenProps {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

const VisuallyHiddenElement = styled('span')({
  position: 'absolute !important',
  width: '1px !important',
  height: '1px !important',
  padding: '0 !important',
  margin: '-1px !important',
  overflow: 'hidden !important',
  clip: 'rect(0, 0, 0, 0) !important',
  whiteSpace: 'nowrap !important',
  border: '0 !important',
});

export const VisuallyHidden = forwardRef<HTMLElement, VisuallyHiddenProps>(
  ({ children, as = 'span', className, ...props }, ref) => {
    return (
      <VisuallyHiddenElement
        as={as}
        ref={ref}
        className={className}
        {...props}
      >
        {children}
      </VisuallyHiddenElement>
    );
  }
);

VisuallyHidden.displayName = 'VisuallyHidden';

/**
 * SkipLink component for keyboard navigation
 * Allows keyboard users to skip repetitive navigation
 */
export interface SkipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

const SkipLinkElement = styled('a')(({ theme }) => ({
  position: 'absolute',
  top: '-40px',
  left: '6px',
  zIndex: theme.zIndex.tooltip + 1,
  padding: '8px 16px',
  backgroundColor: 'var(--color-primary-main)',
  color: 'var(--color-primary-contrast)',
  textDecoration: 'none',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: 600,
  transition: 'top 0.2s ease-in-out',
  
  '&:focus': {
    top: '6px',
    outline: '2px solid var(--color-primary-contrast)',
    outlineOffset: '2px',
  },
  
  '&:hover': {
    backgroundColor: 'var(--color-primary-dark)',
  },
}));

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children, className, ...props }) => {
  return (
    <SkipLinkElement href={href} className={className} {...props}>
      {children}
    </SkipLinkElement>
  );
};

/**
 * FocusableContainer component for managing focus within a container
 */
export interface FocusableContainerProps {
  children: ReactNode;
  trapFocus?: boolean;
  returnFocus?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const FocusableContainer = forwardRef<HTMLElement, FocusableContainerProps>(
  ({ children, trapFocus = false, returnFocus = true, initialFocus, className, as = 'div', ...props }, ref) => {
    // Import hook inside component to avoid circular dependencies
    const { useFocusManagement } = require('../hooks');
    const { containerRef } = useFocusManagement({
      trapFocus,
      returnFocus,
      initialFocus,
    });

    const Element = as as any;

    return (
      <Element
        ref={ref || containerRef}
        className={className}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

FocusableContainer.displayName = 'FocusableContainer';

/**
 * AccessibilityLandmarks component for proper page structure
 */
export interface LandmarkProps {
  children: ReactNode;
  role?: 'banner' | 'navigation' | 'main' | 'complementary' | 'contentinfo' | 'region';
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

const LandmarkElement = styled('div')({
  // No specific styling - this is purely semantic
});

export const Landmark: React.FC<LandmarkProps> = ({ 
  children, 
  role, 
  className,
  ...props 
}) => {
  return (
    <LandmarkElement
      role={role}
      className={className}
      {...props}
    >
      {children}
    </LandmarkElement>
  );
};

/**
 * LiveRegion component for dynamic content announcements
 */
export interface LiveRegionProps {
  children?: ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

const LiveRegionElement = styled('div')({
  position: 'absolute',
  left: '-10000px',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
});

export const LiveRegion = forwardRef<HTMLDivElement, LiveRegionProps>(
  ({ 
    children, 
    politeness = 'polite', 
    atomic = true, 
    relevant = 'all',
    className,
    ...props 
  }, ref) => {
    return (
      <LiveRegionElement
        ref={ref}
        aria-live={politeness}
        aria-atomic={atomic}
        aria-relevant={relevant}
        className={className}
        {...props}
      >
        {children}
      </LiveRegionElement>
    );
  }
);

LiveRegion.displayName = 'LiveRegion';

/**
 * DescribedBy component for associating descriptive text
 */
export interface DescribedByProps {
  id: string;
  children: ReactNode;
  className?: string;
}

const DescribedByElement = styled('div')({
  // Can be visible or hidden depending on use case
});

export const DescribedBy: React.FC<DescribedByProps> = ({ id, children, className, ...props }) => {
  return (
    <DescribedByElement id={id} className={className} {...props}>
      {children}
    </DescribedByElement>
  );
};

/**
 * ErrorMessage component for accessible error display
 */
export interface ErrorMessageProps {
  id?: string;
  children: ReactNode;
  role?: 'alert' | 'status';
  className?: string;
}

const ErrorMessageElement = styled('div')(({ theme }) => ({
  color: 'var(--color-error-main)',
  fontSize: '0.875rem',
  marginTop: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  
  '&[role="alert"]': {
    // More prominent styling for alerts
    fontWeight: 500,
  },
}));

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  id, 
  children, 
  role = 'alert',
  className,
  ...props 
}) => {
  return (
    <ErrorMessageElement
      id={id}
      role={role}
      aria-live="polite"
      className={className}
      {...props}
    >
      {children}
    </ErrorMessageElement>
  );
};

/**
 * RequiredIndicator component for form fields
 */
export interface RequiredIndicatorProps {
  className?: string;
  'aria-label'?: string;
}

const RequiredIndicatorElement = styled('span')(({ theme }) => ({
  color: 'var(--color-error-main)',
  marginLeft: '2px',
  fontSize: '1em',
  lineHeight: 1,
}));

export const RequiredIndicator: React.FC<RequiredIndicatorProps> = ({ 
  className,
  'aria-label': ariaLabel = 'Required field',
  ...props 
}) => {
  return (
    <RequiredIndicatorElement
      aria-label={ariaLabel}
      className={className}
      {...props}
    >
      *
    </RequiredIndicatorElement>
  );
};

/**
 * StatusMessage component for accessible status updates
 */
export interface StatusMessageProps {
  status: 'success' | 'warning' | 'error' | 'info';
  children: ReactNode;
  role?: 'status' | 'alert';
  className?: string;
}

const StatusMessageElement = styled('div')<{ status: StatusMessageProps['status'] }>(({ theme, status }) => {
  const statusColors = {
    success: 'var(--color-success-main)',
    warning: 'var(--color-warning-main)',
    error: 'var(--color-error-main)',
    info: 'var(--color-primary-main)',
  };

  return {
    color: statusColors[status],
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: `color-mix(in srgb, ${statusColors[status]} 10%, transparent)`,
    border: `1px solid color-mix(in srgb, ${statusColors[status]} 30%, transparent)`,
  };
});

export const StatusMessage: React.FC<StatusMessageProps> = ({ 
  status, 
  children, 
  role = status === 'error' ? 'alert' : 'status',
  className,
  ...props 
}) => {
  return (
    <StatusMessageElement
      status={status}
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      className={className}
      {...props}
    >
      {children}
    </StatusMessageElement>
  );
};