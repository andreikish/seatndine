import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF9500',
    secondary: '#FFA726',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    secondaryText: '#666666',
    border: '#E5E5E5',
    notification: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    placeholder: '#666666',
    highlight: '#F8F8F8',
  },
};

export const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#FF9500',
    secondary: '#FFA726',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    secondaryText: '#AEAEB2',
    border: '#38383A',
    notification: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    error: '#FF453A',
    placeholder: '#8E8E93',
    highlight: '#2C2C2E',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
};

const theme = {
  light: lightTheme,
  dark: darkTheme,
  spacing,
  typography,
};

export default theme; 