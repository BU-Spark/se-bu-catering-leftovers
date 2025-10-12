// Unified color scheme matching web app theme

export const colors = {
  primary: '#ab0101',
  primaryDark: '#8a0000',
  primaryLight: '#cc0101',
  secondary: '#2D2926',
  secondaryLight: '#505050',

  background: '#f9fafb',
  surface: '#ffffff',

  text: {
    primary: '#111827',
    secondary: '#4B5563',
    onPrimary: '#ffffff',
  },

  border: {
    light: '#e5e7eb',
    default: '#d1d5db',
  },

  error: '#d93025',
  errorBg: '#fdecea',
  success: '#0b8457',
  warning: '#f59e0b',
};

export const status = {
  open: '#0b8457',
  closed: '#999',
  drafted: '#f59e0b',
  saved: '#2952e3',
};

// Typography styles
export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const },
  h2: { fontSize: 28, fontWeight: '700' as const },
  h3: { fontSize: 24, fontWeight: '700' as const },
  h4: { fontSize: 20, fontWeight: '600' as const },
  h5: { fontSize: 18, fontWeight: '600' as const },
  h6: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};

// Common spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Elevation 
export const elevation = {
  sm: 1,
  md: 2,
  lg: 4,
};

const theme = { colors, status, typography, spacing, borderRadius, elevation };
export default theme;