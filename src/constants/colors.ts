/**
 * Input: None
 * Output: Theme color definitions for light and dark modes with Liquid Glass style
 * Pos: Central color configuration for consistent theming
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

export interface ThemeColors {
  // Base colors
  background: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;

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
  primaryGlow: string;
  destructive: string;
  success: string;

  // Component specific
  cardBackground: string;
  border: string;
  recordingRed: string;
  recordingGlow: string;
  waveform: string;

  // Blur intensity
  blurIntensity: number;
  isDark: boolean;
}

export const colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    // Base - subtle gradient background
    background: '#F5F5F7',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#E8E8ED',

    // Glass - translucent white with subtle borders
    glassBackground: 'rgba(255, 255, 255, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    glassHighlight: 'rgba(255, 255, 255, 0.9)',
    glassShadow: 'rgba(0, 0, 0, 0.08)',

    // Text
    text: '#1D1D1F',
    textSecondary: '#86868B',
    textTertiary: '#AEAEB2',

    // Accent - iOS blue with glow
    primary: '#007AFF',
    primaryGlow: 'rgba(0, 122, 255, 0.3)',
    destructive: '#FF3B30',
    success: '#34C759',

    // Components
    cardBackground: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(0, 0, 0, 0.06)',
    recordingRed: '#FF3B30',
    recordingGlow: 'rgba(255, 59, 48, 0.4)',
    waveform: '#007AFF',

    blurIntensity: 80,
    isDark: false,
  },
  dark: {
    // Base - deep dark with subtle color
    background: '#000000',
    backgroundGradientStart: '#1C1C1E',
    backgroundGradientEnd: '#000000',

    // Glass - translucent dark with luminous borders
    glassBackground: 'rgba(44, 44, 46, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassHighlight: 'rgba(255, 255, 255, 0.15)',
    glassShadow: 'rgba(0, 0, 0, 0.4)',

    // Text
    text: '#FFFFFF',
    textSecondary: '#98989D',
    textTertiary: '#636366',

    // Accent - brighter blue for dark mode with glow
    primary: '#0A84FF',
    primaryGlow: 'rgba(10, 132, 255, 0.4)',
    destructive: '#FF453A',
    success: '#30D158',

    // Components
    cardBackground: 'rgba(44, 44, 46, 0.8)',
    border: 'rgba(255, 255, 255, 0.08)',
    recordingRed: '#FF453A',
    recordingGlow: 'rgba(255, 69, 58, 0.5)',
    waveform: '#0A84FF',

    blurIntensity: 100,
    isDark: true,
  },
};
