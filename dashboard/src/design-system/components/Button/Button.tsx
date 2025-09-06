// PropertyFlow AI Standardized Button Component
// Single API button system replacing dual variant/mode approach

import React, { forwardRef } from 'react';
import { ButtonProps } from './Button.types';
import { StyledButton, ButtonContent, LoadingSpinner } from './Button.styles';

/**
 * PropertyFlow AI standardized Button component
 * 
 * Replaces the previous dual API system (variant + mode) with a clean,
 * single variant API that integrates with the design token system.
 * 
 * Features:
 * - 6 semantic variants (primary, secondary, outline, ghost, danger, success)
 * - 3 sizes (small, medium, large) with accessibility compliance
 * - Loading states with spinner animation  
 * - Icon support (start, end, icon-only)
 * - Full width option for mobile layouts
 * - WCAG 2.1 AA accessibility compliance
 * - Design token integration for theming
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Button variant="primary">Save Changes</Button>
 * 
 * // With icons and loading
 * <Button variant="success" startIcon={<CheckIcon />} loading>
 *   Approving...
 * </Button>
 * 
 * // Danger actions
 * <Button variant="danger" size="small" onClick={handleDelete}>
 *   Delete Property
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      loading = false,
      disabled = false,
      startIcon,
      endIcon,
      children,
      className,
      type = 'button',
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      onClick,
      ...rest
    },
    ref
  ) => {
    // Determine if this is an icon-only button
    const isIconOnly = Boolean((startIcon || endIcon) && !children);
    
    // Handle click events (prevent if loading or disabled)
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };

    // Accessibility considerations
    const accessibilityProps = {
      'aria-label': ariaLabel || (isIconOnly ? 'Button' : undefined),
      'aria-describedby': ariaDescribedBy,
      'aria-disabled': disabled || loading,
      'aria-busy': loading,
    };

    return (
      <StyledButton
        ref={ref}
        type={type}
        className={className}
        disabled={disabled || loading}
        onClick={handleClick}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        loading={loading}
        hasStartIcon={Boolean(startIcon)}
        hasEndIcon={Boolean(endIcon)}
        isIconOnly={isIconOnly}
        {...accessibilityProps}
        {...rest}
      >
        {loading && <LoadingSpinner />}
        
        <ButtonContent className="button-content">
          {startIcon && (
            <span className="button-icon button-start-icon">
              {startIcon}
            </span>
          )}
          
          {children && <span className="button-text">{children}</span>}
          
          {endIcon && (
            <span className="button-icon button-end-icon">
              {endIcon}
            </span>
          )}
        </ButtonContent>
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;