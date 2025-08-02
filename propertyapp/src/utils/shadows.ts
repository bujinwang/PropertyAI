import { Platform, ViewStyle } from 'react-native';

interface ShadowConfig {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

/**
 * Creates cross-platform shadow styles
 * Uses boxShadow for web and individual shadow props for native
 */
export const createShadow = (config: ShadowConfig): ViewStyle => {
  const {
    shadowColor = '#000',
    shadowOffset = { width: 0, height: 2 },
    shadowOpacity = 0.1,
    shadowRadius = 4,
    elevation = 2,
  } = config;

  if (Platform.OS === 'web') {
    // Use boxShadow for web to avoid deprecation warnings
    const { width, height } = shadowOffset;
    const alpha = shadowOpacity;
    const blur = shadowRadius;
    
    return {
      boxShadow: `${width}px ${height}px ${blur}px rgba(0, 0, 0, ${alpha})`,
    } as ViewStyle;
  }

  // Use individual shadow props for native platforms
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
  };
};

// Common shadow presets
export const shadows = {
  small: createShadow({
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  }),
  
  medium: createShadow({
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  }),
  
  large: createShadow({
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  }),
  
  card: createShadow({
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  }),
};