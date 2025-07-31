import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { TOUCH_TARGETS } from '@/styles/mobileLayout';

interface TouchableProps extends TouchableOpacityProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  hitSlop?: number;
}

export const Touchable: React.FC<TouchableProps> = ({
  size = 'medium',
  variant = 'default',
  disabled = false,
  hitSlop = 8,
  style,
  children,
  ...props
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return TOUCH_TARGETS.min;
      case 'medium': return TOUCH_TARGETS.regular;
      case 'large': return TOUCH_TARGETS.large;
      case 'xlarge': return TOUCH_TARGETS.xlarge;
      default: return TOUCH_TARGETS.regular;
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'ghost':
        return styles.ghost;
      default:
        return styles.default;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { minHeight: getSize(), minWidth: getSize() },
        getVariantStyle(),
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      hitSlop={{ top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop }}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  default: {
    backgroundColor: 'transparent',
  },
  primary: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondary: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.5,
  },
});

// Back button component with proper touch target
export const BackButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <Touchable
    size="large"
    onPress={onPress}
    hitSlop={12}
    style={styles.backButton}
  >
    {/* Add back arrow icon here */}
  </Touchable>
);

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
    width: 44,
    height: 44,
  },
});

// Haptic feedback utility
export const useHapticFeedback = () => {
  const trigger = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
      // Import and use React Native Haptic Feedback
      // import * as Haptics from 'expo-haptics';
      // Haptics.impactAsync(
      //   type === 'light' ? Haptics.ImpactFeedbackStyle.Light :
      //   type === 'medium' ? Haptics.ImpactFeedbackStyle.Medium :
      //   Haptics.ImpactFeedbackStyle.Heavy
      // );
    }
  };

  return { trigger };
};