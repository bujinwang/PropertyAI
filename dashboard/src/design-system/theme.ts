import { createTheme, alpha } from '@mui/material/styles';

// Define the color palette
const palette = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#fff',
  },
  secondary: {
    main: '#dc004e',
    light: '#ff4081',
    dark: '#c51162',
    contrastText: '#fff',
  },
  error: {
    main: '#d32f2f',
  },
  warning: {
    main: '#ffa000',
  },
  info: {
    main: '#1976d2',
  },
  success: {
    main: '#388e3c',
  },
  background: {
    default: '#f5f5f5',
    paper: '#fff',
  },
};

// Define the typography system
const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 700,
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 700,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 700,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 700,
  },
  body1: {
    fontSize: '1rem',
  },
  body2: {
    fontSize: '0.875rem',
  },
  caption: {
    fontSize: '0.75rem',
  },
};

// Create the theme with alpha function support
const theme = createTheme({
  palette,
  typography,
});

// Add alpha function to theme for compatibility
(theme as any).alpha = alpha;

export default theme;
export { alpha };
