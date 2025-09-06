import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

// Define the theme using PropertyFlow AI design tokens
const theme = createTheme({
  palette: {
    primary: {
      light: tokens.colors.semantic.primary.light,
      main: tokens.colors.semantic.primary.main,
      dark: tokens.colors.semantic.primary.dark,
      contrastText: tokens.colors.semantic.primary.contrast,
    },
    secondary: {
      light: tokens.colors.semantic.secondary.light,
      main: tokens.colors.semantic.secondary.main,
      dark: tokens.colors.semantic.secondary.dark,
      contrastText: tokens.colors.semantic.secondary.contrast,
    },
    error: {
      light: tokens.colors.semantic.error.light,
      main: tokens.colors.semantic.error.main,
      dark: tokens.colors.semantic.error.dark,
      contrastText: tokens.colors.semantic.error.contrast,
    },
    warning: {
      light: tokens.colors.semantic.warning.light,
      main: tokens.colors.semantic.warning.main,
      dark: tokens.colors.semantic.warning.dark,
      contrastText: tokens.colors.semantic.warning.contrast,
    },
    info: {
      main: tokens.colors.primitive.blue[400],
    },
    success: {
      light: tokens.colors.semantic.success.light,
      main: tokens.colors.semantic.success.main,
      dark: tokens.colors.semantic.success.dark,
      contrastText: tokens.colors.semantic.success.contrast,
    },
    text: {
      primary: tokens.colors.semantic.text.primary,
      secondary: tokens.colors.semantic.text.secondary,
      disabled: tokens.colors.semantic.text.disabled,
    },
    background: {
      default: tokens.colors.semantic.background.default,
      paper: tokens.colors.semantic.background.paper,
    },
  },
  typography: {
    fontFamily: tokens.typography.fontFamily.sans,
    h1: {
      fontSize: tokens.typography.heading.h1.fontSize,
      fontWeight: tokens.typography.heading.h1.fontWeight,
      lineHeight: tokens.typography.heading.h1.lineHeight,
      letterSpacing: tokens.typography.heading.h1.letterSpacing,
    },
    h2: {
      fontSize: tokens.typography.heading.h2.fontSize,
      fontWeight: tokens.typography.heading.h2.fontWeight,
      lineHeight: tokens.typography.heading.h2.lineHeight,
      letterSpacing: tokens.typography.heading.h2.letterSpacing,
    },
    h3: {
      fontSize: tokens.typography.heading.h3.fontSize,
      fontWeight: tokens.typography.heading.h3.fontWeight,
      lineHeight: tokens.typography.heading.h3.lineHeight,
    },
    h4: {
      fontSize: tokens.typography.heading.h4.fontSize,
      fontWeight: tokens.typography.heading.h4.fontWeight,
      lineHeight: tokens.typography.heading.h4.lineHeight,
    },
    h5: {
      fontSize: tokens.typography.heading.h5.fontSize,
      fontWeight: tokens.typography.heading.h5.fontWeight,
      lineHeight: tokens.typography.heading.h5.lineHeight,
    },
    h6: {
      fontSize: tokens.typography.heading.h6.fontSize,
      fontWeight: tokens.typography.heading.h6.fontWeight,
      lineHeight: tokens.typography.heading.h6.lineHeight,
    },
    body1: {
      fontSize: tokens.typography.body.medium.fontSize,
      fontWeight: tokens.typography.body.medium.fontWeight,
      lineHeight: tokens.typography.body.medium.lineHeight,
    },
    body2: {
      fontSize: tokens.typography.body.small.fontSize,
      fontWeight: tokens.typography.body.small.fontWeight,
      lineHeight: tokens.typography.body.small.lineHeight,
    },
    caption: {
      fontSize: tokens.typography.caption.fontSize,
      fontWeight: tokens.typography.caption.fontWeight,
      lineHeight: tokens.typography.caption.lineHeight,
    },
    overline: {
      fontSize: tokens.typography.overline.fontSize,
      fontWeight: tokens.typography.overline.fontWeight,
      lineHeight: tokens.typography.overline.lineHeight,
      letterSpacing: tokens.typography.overline.letterSpacing,
      textTransform: tokens.typography.overline.textTransform as any,
    },
  },
  spacing: tokens.spacing.values.sm, // 8px base unit for Material-UI spacing
  shape: {
    borderRadius: parseInt(tokens.borderRadius.md.replace('rem', '')) * 16, // Convert rem to px for MUI
  },
  shadows: [
    tokens.shadows.none,
    tokens.shadows.sm,
    tokens.shadows.base,
    tokens.shadows.md,
    tokens.shadows.lg,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
  ],
});

export default theme;
