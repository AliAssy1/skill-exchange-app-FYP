/**
 * SkillSwap Design System
 * Primary palette: Violet/Purple — modern, distinct, professional
 */

import { Platform } from 'react-native';

const tintColorLight = '#7C3AED';
const tintColorDark  = '#A78BFA';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const AppColors = {
  // Primary Brand — Rich Violet
  primary: {
    50:  '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Accent — Soft Rose/Pink
  accent: {
    50:  '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },

  // Neutral / Gray Scale
  neutral: {
    50:  '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },

  // Semantic Colors
  success: {
    50:  '#F0FDF4',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  warning: {
    50:  '#FEFCE8',
    500: '#EAB308',
    600: '#CA8A04',
    700: '#A16207',
  },
  error: {
    50:  '#FFF1F2',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
  },
  info: {
    50:  '#F0F9FF',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
  },

  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
};

// Typography Scale
export const Typography = {
  fontSize: {
    xs:   12,
    sm:   14,
    base: 16,
    lg:   18,
    xl:   20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeight: {
    normal:    '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight:   1.2,
    normal:  1.5,
    relaxed: 1.75,
  },
};

// Spacing Scale (8pt grid)
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// Border Radius
export const BorderRadius = {
  none: 0,
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  '2xl': 24,
  full: 9999,
};

// Elevation / Shadows
export const Shadows = {
  sm: {
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});
