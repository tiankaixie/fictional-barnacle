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
  // Background colors - warm cream tones (Claude style)
  background: '#F4F3EE',          // Pampas cream (was #F5F5F7)
  backgroundSecondary: '#FDFCFA', // Warmer white (was #FFFFFF)

  // Glass effect colors - warm amber tints
  glassBackground: 'rgba(253, 248, 242, 0.75)',  // Warm glass (was pure white)
  glassBorder: 'rgba(193, 95, 60, 0.25)',        // Amber border (was white)
  glassHighlight: 'rgba(255, 245, 235, 0.95)',   // Warm highlight
  glassShadow: 'rgba(120, 60, 40, 0.12)',        // Warm brown shadow (was black)

  // Text colors - slightly warmer blacks
  text: '#1A1715',               // Warm near-black (was #000000)
  textSecondary: '#6B5D57',      // Warm gray (was #666666)
  textTertiary: '#9C8D87',       // Warm tertiary (was #8E8E93)

  // Accent colors - Claude terracotta/amber palette
  primary: '#C15F3C',            // Terracotta (was #007AFF blue)
  secondary: '#D97706',          // Amber (was #5856D6 purple)
  success: '#16A34A',            // Warm green (was #34C759)
  warning: '#F59E0B',            // Amber warning (was #FF9500)
  error: '#DC2626',              // Warm red (was #FF453A)

  // Interactive states - warm tints
  pressedOverlay: 'rgba(120, 60, 40, 0.12)',
  hoverOverlay: 'rgba(120, 60, 40, 0.06)',
};

export const darkColors: ThemeColors = {
  // Background colors - warm charcoal instead of true black
  background: '#1A1715',         // Warm near-black (was #000000)
  backgroundSecondary: '#2C2825', // Warm charcoal (was #1C1C1E)

  // Glass effect colors - warm dark glass
  glassBackground: 'rgba(44, 40, 37, 0.75)',
  glassBorder: 'rgba(193, 95, 60, 0.3)',
  glassHighlight: 'rgba(255, 245, 235, 0.15)',
  glassShadow: 'rgba(0, 0, 0, 0.4)',

  // Text colors - warm whites
  text: '#FAF9F7',               // Warm white (was #FFFFFF)
  textSecondary: '#E8E3DF',      // Warm secondary (was #EBEBF5)
  textTertiary: '#9C8D87',       // Same warm gray

  // Accent colors - brighter for dark mode
  primary: '#E07756',            // Lighter terracotta (was #0A84FF)
  secondary: '#F59E0B',          // Bright amber (was #5E5CE6)
  success: '#22C55E',            // Bright green (was #32D74B)
  warning: '#FBBF24',            // Bright amber (was #FF9F0A)
  error: '#EF4444',              // Bright red (was #FF453A)

  // Interactive states - warm overlay
  pressedOverlay: 'rgba(255, 245, 235, 0.12)',
  hoverOverlay: 'rgba(255, 245, 235, 0.06)',
};
