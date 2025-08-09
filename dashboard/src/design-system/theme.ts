import { createTheme, alpha } from '@mui/material/styles';

// Modern light palette
const primaryMain = '#6366F1'; // indigo
const primaryDark = '#4F46E5';
const primaryLight = '#A5B4FC';
const secondaryMain = '#14B8A6'; // teal
const backgroundDefault = '#F6F7FB';
const backgroundPaper = '#FFFFFF';
const textPrimary = '#0F172A'; // slate-900
const textSecondary = '#475569'; // slate-600
const dividerColor = 'rgba(15, 23, 42, 0.08)';

const palette = {
  mode: 'light' as const,
  primary: {
    main: primaryMain,
    dark: primaryDark,
    light: primaryLight,
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: secondaryMain,
    dark: '#0D9488',
    light: '#99F6E4',
    contrastText: '#062C2B',
  },
  error: { main: '#EF4444' },
  warning: { main: '#F59E0B' },
  info: { main: '#0EA5E9' },
  success: { main: '#16A34A' },
  text: {
    primary: textPrimary,
    secondary: textSecondary,
  },
  divider: dividerColor,
  background: {
    default: backgroundDefault,
    paper: backgroundPaper,
  },
  grey: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1F2937',
    900: '#0F172A',
  },
} as const;

// Modern typography using Inter
const typography = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  h1: { fontSize: '3rem', fontWeight: 700, letterSpacing: '-0.02em' },
  h2: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em' },
  h3: { fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.01em' },
  h4: { fontSize: '1.5rem', fontWeight: 600 },
  h5: { fontSize: '1.25rem', fontWeight: 600 },
  h6: { fontSize: '1.125rem', fontWeight: 600 },
  subtitle1: { fontSize: '1rem', fontWeight: 600, color: textSecondary },
  body1: { fontSize: '1rem', lineHeight: 1.6 },
  body2: { fontSize: '0.9375rem', lineHeight: 1.55 },
  caption: { fontSize: '0.8125rem', color: textSecondary },
  button: { textTransform: 'none', fontWeight: 600 },
} as const;

const theme = createTheme({
  palette,
  typography,
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: 'light',
        },
        body: {
          backgroundColor: backgroundDefault,
          color: textPrimary,
          fontFeatureSettings: '"cv02","cv03","cv04","cv11"',
        },
        '*::-webkit-scrollbar': {
          width: 10,
          height: 10,
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(textPrimary, 0.12),
          borderRadius: 999,
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${primaryMain} 0%, ${primaryDark} 100%)`,
          color: '#fff',
          boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
          '&:hover': {
            background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryMain} 100%)`,
            boxShadow: '0 10px 24px rgba(99, 102, 241, 0.45)',
          },
        },
        outlined: {
          borderColor: alpha(textPrimary, 0.15),
          '&:hover': { borderColor: alpha(textPrimary, 0.25), backgroundColor: alpha(primaryMain, 0.04) },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
          border: `1px solid ${dividerColor}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${dividerColor}`,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#FFFFFF', 0.7),
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: textPrimary,
          borderBottom: `1px solid ${alpha(textPrimary, 0.06)}`,
          boxShadow: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(textPrimary, 0.12),
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(textPrimary, 0.24),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(primaryMain, 0.6),
            boxShadow: `0 0 0 3px ${alpha(primaryMain, 0.16)}`,
          },
        },
        input: {
          paddingTop: 12,
          paddingBottom: 12,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: 8, fontSize: '0.8125rem' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: `1px solid ${dividerColor}`,
          boxShadow: '0 16px 48px rgba(15, 23, 42, 0.18)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 44,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: textSecondary },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: dividerColor },
      },
    },
  },
});

// Add alpha function to theme for compatibility
(theme as any).alpha = alpha;

export default theme;
export { alpha };
