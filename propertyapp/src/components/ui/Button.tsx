import React, { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonMode = 'contained' | 'outlined' | 'text';

interface ButtonProps {
  title?: string;
  children?: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  mode?: ButtonMode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  mode,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  // Map mode to variant for compatibility with both APIs
  const mappedVariant = mode ? mapModeToVariant(mode) : variant;
  
  const getButtonStyle = () => {
    if (disabled) {
      return styles.disabledButton;
    }
    
    switch (mappedVariant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'primary':
      default:
        return styles.primaryButton;
    }
  };
  
  const getTextStyle = () => {
    if (disabled) {
      return styles.disabledText;
    }
    
    switch (mappedVariant) {
      case 'outline':
        return styles.outlineText;
      case 'secondary':
      case 'primary':
      default:
        return styles.buttonText;
    }
  };

  // Button content can be either children or title
  const content = loading ? (
    <ActivityIndicator
      size="small"
      color={mappedVariant === 'outline' ? COLORS.primary : COLORS.background}
    />
  ) : (
    children || (title && <Text style={[getTextStyle(), textStyle]}>{title}</Text>)
  );

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
};

// Helper function to map mode to variant
const mapModeToVariant = (mode: ButtonMode): ButtonVariant => {
  switch (mode) {
    case 'contained':
      return 'primary';
    case 'outlined':
      return 'outline';
    case 'text':
      return 'secondary';
    default:
      return 'primary';
  }
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: COLORS.border,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold as '600',
    textAlign: 'center',
  },
  outlineText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold as '600',
    textAlign: 'center',
  },
  disabledText: {
    color: COLORS.text.muted,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold as '600',
    textAlign: 'center',
  },
}); 