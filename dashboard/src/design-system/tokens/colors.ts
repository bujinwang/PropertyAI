// PropertyFlow AI Design Tokens - Colors
// Foundation color system for consistent theming across platforms

export interface PrimitiveColors {
  blue: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  green: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  amber: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  red: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

export interface SemanticColors {
  primary: {
    light: string;
    main: string;
    dark: string;
    contrast: string;
  };
  secondary: {
    light: string;
    main: string;
    dark: string;
    contrast: string;
  };
  success: {
    light: string;
    main: string;
    dark: string;
    contrast: string;
  };
  warning: {
    light: string;
    main: string;
    dark: string;
    contrast: string;
  };
  error: {
    light: string;
    main: string;
    dark: string;
    contrast: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  background: {
    default: string;
    paper: string;
    elevated: string;
  };
  surface: {
    default: string;
    hover: string;
    selected: string;
    disabled: string;
  };
}

export const primitiveColors: PrimitiveColors = {
  blue: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#1976d2', // PropertyFlow brand blue
    600: '#1565c0',
    700: '#0d47a1',
    800: '#0a3d91',
    900: '#073282',
  },
  green: {
    50: '#e8f5e8',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  amber: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#ffc107',
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00',
  },
  red: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

export const semanticColors: SemanticColors = {
  primary: {
    light: primitiveColors.blue[300],
    main: primitiveColors.blue[500],
    dark: primitiveColors.blue[700],
    contrast: '#ffffff',
  },
  secondary: {
    light: primitiveColors.gray[300],
    main: primitiveColors.gray[500],
    dark: primitiveColors.gray[700],
    contrast: '#ffffff',
  },
  success: {
    light: primitiveColors.green[300],
    main: primitiveColors.green[500],
    dark: primitiveColors.green[700],
    contrast: '#ffffff',
  },
  warning: {
    light: primitiveColors.amber[300],
    main: primitiveColors.amber[500],
    dark: primitiveColors.amber[700],
    contrast: '#000000',
  },
  error: {
    light: primitiveColors.red[300],
    main: primitiveColors.red[500],
    dark: primitiveColors.red[700],
    contrast: '#ffffff',
  },
  text: {
    primary: primitiveColors.gray[900],
    secondary: primitiveColors.gray[600],
    disabled: primitiveColors.gray[400],
  },
  background: {
    default: '#ffffff',
    paper: primitiveColors.gray[50],
    elevated: '#ffffff',
  },
  surface: {
    default: primitiveColors.gray[100],
    hover: primitiveColors.gray[200],
    selected: primitiveColors.blue[50],
    disabled: primitiveColors.gray[100],
  },
};