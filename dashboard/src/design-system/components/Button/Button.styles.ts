// PropertyFlow AI Button Component Styles
// Styled components using design tokens for consistent theming

import { styled, keyframes, alpha } from '@mui/material/styles';
import { Button as MuiButton } from '@mui/material';
import { tokens } from '../../tokens';
import { ButtonStyleProps, ButtonVariant, ButtonSize } from './Button.types';

// Loading spinner animation
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Get size styles
const getSizeStyles = (size: ButtonSize, isIconOnly: boolean) => {
  const sizes = {
    small: {
      height: '32px',
      fontSize: tokens.typography.body.small.fontSize,
      padding: isIconOnly ? tokens.spacing.xs : `${tokens.spacing.xs} ${tokens.spacing.md}`,
    },
    medium: {
      height: '44px', // WCAG 2.1 AA minimum touch target
      fontSize: tokens.typography.body.medium.fontSize,
      padding: isIconOnly ? tokens.spacing.sm : `${tokens.spacing.sm} ${tokens.spacing.lg}`,
    },
    large: {
      height: '56px',
      fontSize: tokens.typography.body.large.fontSize,
      padding: isIconOnly ? tokens.spacing.md : `${tokens.spacing.md} ${tokens.spacing.xl}`,
    },
  };

  const sizeConfig = sizes[size];
  
  return {
    height: sizeConfig.height,
    minHeight: sizeConfig.height,
    fontSize: sizeConfig.fontSize,
    padding: sizeConfig.padding,
    ...(isIconOnly && {
      width: sizeConfig.height,
      minWidth: sizeConfig.height,
    }),
  };
};

// Get variant styles
const getVariantStyles = (variant: ButtonVariant, theme: any) => {
  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary-main)',
      color: 'var(--color-primary-contrast)',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--color-primary-dark)',
        transform: 'translateY(-1px)',
        boxShadow: tokens.shadows.md,
      },
      '&:active:not(:disabled)': {
        transform: 'translateY(0)',
        boxShadow: tokens.shadows.sm,
      },
    },
    
    secondary: {
      backgroundColor: 'var(--color-secondary-main)',
      color: 'var(--color-secondary-contrast)',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--color-secondary-dark)',
        transform: 'translateY(-1px)',
        boxShadow: tokens.shadows.md,
      },
      '&:active:not(:disabled)': {
        transform: 'translateY(0)',
        boxShadow: tokens.shadows.sm,
      },
    },
    
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary-main)',
      border: '1px solid var(--color-primary-main)',
      '&:hover:not(:disabled)': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderColor: 'var(--color-primary-dark)',
        transform: 'translateY(-1px)',
      },
      '&:active:not(:disabled)': {
        transform: 'translateY(0)',
        backgroundColor: 'var(--color-primary-main)',
        color: 'var(--color-primary-contrast)',
      },
    },
    
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary-main)',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--color-surface-hover)',
        transform: 'translateY(-1px)',
      },
      '&:active:not(:disabled)': {
        transform: 'translateY(0)',
        backgroundColor: 'var(--color-surface-selected)',
      },
    },
    
    danger: {
      backgroundColor: 'var(--color-error-main)',
      color: 'var(--color-error-contrast)',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--color-error-dark)',
        transform: 'translateY(-1px)',
        boxShadow: tokens.shadows.md,
      },
      '&:active:not(:disabled)': {
        transform: 'translateY(0)',
        boxShadow: tokens.shadows.sm,
      },
    },
    
    success: {
      backgroundColor: 'var(--color-success-main)',
      color: 'var(--color-success-contrast)',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--color-success-dark)',
        transform: 'translateY(-1px)',
        boxShadow: tokens.shadows.md,
      },
      '&:active:not(:disabled)': {
        transform: 'translateY(0)',
        boxShadow: tokens.shadows.sm,
      },
    },
  };

  return variants[variant];
};

// Main styled button component
export const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => !['variant', 'size', 'fullWidth', 'loading', 'hasStartIcon', 'hasEndIcon', 'isIconOnly'].includes(prop as string),
})<ButtonStyleProps>(({ theme, variant, size, fullWidth, loading, isIconOnly }) => ({
  // Base styles
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: tokens.spacing.xs,
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'none',
  fontFamily: tokens.typography.fontFamily.sans,
  fontWeight: tokens.typography.fontWeight.medium,
  lineHeight: tokens.typography.body.medium.lineHeight,
  borderRadius: tokens.borderRadius.md,
  transition: 'all 0.2s ease-in-out',
  position: 'relative',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  outline: 'none',
  textTransform: 'none',
  
  // Full width
  width: fullWidth ? '100%' : 'auto',
  
  // Focus styles for accessibility
  '&:focus-visible': {
    outline: '2px solid var(--color-primary-main)',
    outlineOffset: '2px',
  },
  
  // Disabled state
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
    pointerEvents: 'none',
  },
  
  // Loading state
  ...(loading && {
    cursor: 'not-allowed',
    pointerEvents: 'none',
    
    '& .button-content': {
      opacity: 0.7,
    },
  }),
  
  // Size styles
  ...getSizeStyles(size, isIconOnly),
  
  // Variant styles
  ...getVariantStyles(variant, theme),
}));

// Button content wrapper
export const ButtonContent = styled('span')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: tokens.spacing.xs,
  
  '& .button-icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    
    '& svg': {
      width: '1.25em',
      height: '1.25em',
    },
  },
});

// Loading spinner
export const LoadingSpinner = styled('span')({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '1em',
  height: '1em',
  border: '2px solid currentColor',
  borderRadius: '50%',
  borderTopColor: 'transparent',
  animation: `${spin} 1s linear infinite`,
});