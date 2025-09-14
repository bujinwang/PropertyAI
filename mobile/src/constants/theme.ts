import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

const fontConfig = {
  fontFamily: 'System',
};

export const lightTheme = {
  ...MD3LightTheme,
  ...DefaultTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...DefaultTheme.colors,
    primary: '#1976d2',
    secondary: '#dc004e',
    accent: '#ff4081',
    background: '#ffffff',
    surface: '#f5f5f5',
    error: '#d32f2f',
    text: '#212121',
    onSurface: '#212121',
    disabled: '#9e9e9e',
    placeholder: '#9e9e9e',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#ff4081',
  },
  fonts: configureFonts({ config: fontConfig }),
};

export const darkTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
    primary: '#90caf9',
    secondary: '#f48fb1',
    accent: '#ff4081',
    background: '#121212',
    surface: '#1e1e1e',
    error: '#f44336',
    text: '#ffffff',
    onSurface: '#ffffff',
    disabled: '#757575',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.7)',
    notification: '#ff4081',
  },
  fonts: configureFonts({ config: fontConfig }),
};

export const theme = lightTheme;