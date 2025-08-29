import { createTheme } from '@mui/material/styles';

// Define the theme based on the UI/UX specification
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976D2', // Professional Blue
    },
    secondary: {
      main: '#9E9E9E', // Neutral Grey
    },
    error: {
      main: '#F44336', // Red
    },
    warning: {
      main: '#FF9800', // Orange
    },
    info: {
      // Using the Accent color for 'info' is a reasonable mapping
      main: '#FFC107', // Sunny Yellow
    },
    success: {
      main: '#4CAF50', // Green
    },
  },
  typography: {
    fontFamily: 'Roboto, "Helvetica", "Arial", sans-serif',
  },
  // We will use the default component styles and shape provided by Material UI
  // to align with the spec, which did not request custom component overrides.
});

export default theme;
