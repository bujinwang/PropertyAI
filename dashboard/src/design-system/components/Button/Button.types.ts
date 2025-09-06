// PropertyFlow AI Button Component Types
// TypeScript interfaces for the standardized button system

import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  /**
   * Button variant that determines the visual style
   * @default 'primary'
   */
  variant?: ButtonVariant;
  
  /**
   * Button size that affects padding and height
   * @default 'medium'
   */
  size?: ButtonSize;
  
  /**
   * Makes the button take full width of its container
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Shows loading spinner and disables interaction
   * @default false
   */
  loading?: boolean;
  
  /**
   * Icon displayed before the button text
   */
  startIcon?: ReactNode;
  
  /**
   * Icon displayed after the button text
   */
  endIcon?: ReactNode;
  
  /**
   * Button content
   */
  children?: ReactNode;
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Accessibility label for screen readers
   */
  'aria-label'?: string;
  
  /**
   * Accessibility description for screen readers
   */
  'aria-describedby'?: string;
}

export interface ButtonStyleProps {
  variant: ButtonVariant;
  size: ButtonSize;
  fullWidth: boolean;
  loading: boolean;
  disabled: boolean;
  hasStartIcon: boolean;
  hasEndIcon: boolean;
  isIconOnly: boolean;
}