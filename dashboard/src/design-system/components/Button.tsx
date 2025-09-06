// PropertyFlow AI Standardized Button - Main Export
// This file provides the standardized button implementation that replaces
// the previous dual API system (variant + mode props)

import React from 'react';

// Import the new standardized button system
export { Button as default, Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button/index';

// Temporary legacy wrapper for migration period
// This ensures existing imports continue to work while we migrate
import { Button as NewButton, ButtonProps as NewButtonProps } from './Button/index';

// Re-export for backward compatibility during migration
export const LegacyButton: React.FC<NewButtonProps> = (props) => {
  return <NewButton {...props} />;
};
