// Mobile-Optimized Layout System
import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

// Standard mobile breakpoints
export const BREAKPOINTS = {
  phone: 375,
  tablet: 768,
  desktop: 1024,
};

// Safe area calculations
export const SAFE_AREA = {
  top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
  bottom: Platform.OS === 'ios' ? 34 : 0,
  left: 0,
  right: 0,
};

// Touch target standards (minimum 44x44px per Apple HIG)
export const TOUCH_TARGETS = {
  min: 44,
  regular: 48,
  large: 56,
  xlarge: 64,
};

// Layout spacing system
export const LAYOUT = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  elevation: {
    light: 2,
    medium: 4,
    heavy: 8,
  },
};

// Screen-specific layout constants
export const SCREEN_LAYOUT = {
  headerHeight: 56,
  tabBarHeight: 83,
  bottomSheetMinHeight: 100,
  cardAspectRatio: 16 / 9,
  imageAspectRatio: 4 / 3,
};

// Content width calculations
export const CONTENT_WIDTH = {
  full: width,
  withMargins: width - (LAYOUT.spacing.md * 2),
  card: width - (LAYOUT.spacing.md * 2),
  maxWidth: Math.min(width - (LAYOUT.spacing.md * 2), 400),
};

// Responsive utilities
export const responsive = {
  width,
  height,
  isSmallScreen: width < BREAKPOINTS.phone,
  isTablet: width >= BREAKPOINTS.tablet,
  
  // Scale functions for responsive design
  scale: (size: number) => (width / 375) * size,
  verticalScale: (size: number) => (height / 667) * size,
  moderateScale: (size: number, factor = 0.5) => 
    size + (responsive.scale(size) - size) * factor,
};

// Grid system
export const GRID = {
  columns: 12,
  gutterWidth: LAYOUT.spacing.md,
  margin: LAYOUT.spacing.md,
  
  // Calculate column width
  getColumnWidth: (columns: number) => {
    const totalGutterWidth = (columns - 1) * GRID.gutterWidth;
    const totalMargin = GRID.margin * 2;
    return (width - totalGutterWidth - totalMargin) / columns;
  },
};

// Card layouts for horizontal scrolling
export const CARD_LAYOUTS = {
  // Horizontal scroll cards
  horizontalCard: {
    width: width * 0.8,
    height: 120,
    marginRight: LAYOUT.spacing.md,
  },
  
  // Compact cards for lists
  compactCard: {
    width: CONTENT_WIDTH.card,
    minHeight: 80,
    marginBottom: LAYOUT.spacing.sm,
  },
  
  // Featured cards
  featuredCard: {
    width: CONTENT_WIDTH.card,
    height: 200,
    marginBottom: LAYOUT.spacing.md,
  },
};