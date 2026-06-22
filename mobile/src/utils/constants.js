import Constants from 'expo-constants';

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:8080';

export const COLORS = {
  primary:    '#1c6681',
  primaryDark:'#14516a',
  navy:       '#1a3868',
  bg:         '#f1f5f9',
  white:      '#ffffff',
  text:       '#0f172a',
  textMuted:  '#64748b',
  textLight:  '#94a3b8',
  border:     '#e2e8f0',
  danger:     '#dc2626',
  success:    '#059669',
  warning:    '#d97706',
  info:       '#2563eb',
};

export const FONTS = {
  regular: 'System',
  medium:  'System',
  bold:    'System',
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};
