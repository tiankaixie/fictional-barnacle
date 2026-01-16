/**
 * Input: None (color definitions)
 * Output: Theme color schemes for light and dark modes
 * Pos: Theme color system for Liquid Glass UI
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;

  // Glass effect colors
  glassBackground: string;
  glassBorder: string;
  glassHighlight: string;
  glassShadow: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Accent colors
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;

  // Interactive states
  pressedOverlay: string;
  hoverOverlay: string;
}

export const lightColors: ThemeColors = {
  // Background colors
  background: '#F5F5F7',
  backgroundSecondary: '#FFFFFF',

  // Glass effect colors
  glassBackground: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.4)',
  glassHighlight: 'rgba(255, 255, 255, 0.9)',
  glassShadow: 'rgba(0, 0, 0, 0.1)',

  // Text colors
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#8E8E93',

  // Accent colors
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF453A',

  // Interactive states
  pressedOverlay: 'rgba(0, 0, 0, 0.1)',
  hoverOverlay: 'rgba(0, 0, 0, 0.05)',
};

export const darkColors: ThemeColors = {
  // Background colors
  background: '#000000',
  backgroundSecondary: '#1C1C1E',

  // Glass effect colors
  glassBackground: 'rgba(28, 28, 30, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHighlight: 'rgba(255, 255, 255, 0.15)',
  glassShadow: 'rgba(0, 0, 0, 0.3)',

  // Text colors
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textTertiary: '#8E8E93',

  // Accent colors
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  success: '#32D74B',
  warning: '#FF9F0A',
  error: '#FF453A',

  // Interactive states
  pressedOverlay: 'rgba(255, 255, 255, 0.1)',
  hoverOverlay: 'rgba(255, 255, 255, 0.05)',
};
