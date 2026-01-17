/**
 * Input: None (color definitions based on official Claude brand palette)
 * Output: Theme color schemes for light and dark modes
 * Pos: Theme color system using Claude official colors (Crail, Cloudy, Pampas)
 * If this file is updated, you must update this header and the parent folder's README.md.
 *
 * Official Claude Brand Colors:
 * - Crail: #C15F3C (primary terracotta)
 * - Cloudy: #B1ADA1 (neutral grey)
 * - Pampas: #F4F3EE (cream background)
 * - Alternative Primary: #DA7756 (lighter terracotta)
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
  // Background colors - Official Claude Pampas cream (#F4F3EE)
  background: '#F4F3EE',          // Pampas - Official Claude background
  backgroundSecondary: '#FFFFFF', // Pure white for cards

  // Glass effect colors - Subtle warm tints based on Crail
  glassBackground: 'rgba(255, 255, 255, 0.80)',  // Clean white glass
  glassBorder: 'rgba(193, 95, 60, 0.15)',        // Crail tint border
  glassHighlight: 'rgba(255, 255, 255, 0.95)',   // Bright highlight
  glassShadow: 'rgba(193, 95, 60, 0.08)',        // Crail-tinted shadow

  // Text colors - Warm with Cloudy (#B1ADA1) influence
  text: '#1A1715',               // Deep warm black
  textSecondary: '#6B5D57',      // Medium warm grey
  textTertiary: '#B1ADA1',       // Cloudy - Official Claude grey

  // Accent colors - Official Claude Crail (#C15F3C)
  primary: '#C15F3C',            // Crail - Official Claude terracotta
  secondary: '#DA7756',          // Alternative Claude primary (lighter)
  success: '#16A34A',            // Warm green
  warning: '#F59E0B',            // Amber
  error: '#DC2626',              // Warm red

  // Interactive states - Crail-based overlays
  pressedOverlay: 'rgba(193, 95, 60, 0.12)',
  hoverOverlay: 'rgba(193, 95, 60, 0.06)',
};

export const darkColors: ThemeColors = {
  // Background colors - Deep warm tones
  background: '#1A1715',         // Deep warm black
  backgroundSecondary: '#2C2825', // Warm charcoal

  // Glass effect colors - Subtle warm glass on dark
  glassBackground: 'rgba(44, 40, 37, 0.80)',     // Dark warm glass
  glassBorder: 'rgba(218, 119, 86, 0.25)',       // Lighter Crail tint
  glassHighlight: 'rgba(244, 243, 238, 0.12)',   // Pampas-tinted highlight
  glassShadow: 'rgba(0, 0, 0, 0.40)',            // Deep shadow

  // Text colors - Warm tinted whites with Cloudy
  text: '#F4F3EE',               // Pampas for text on dark
  textSecondary: '#C9C5BE',      // Lighter version of Cloudy
  textTertiary: '#B1ADA1',       // Cloudy - Official Claude grey

  // Accent colors - Brighter Crail for contrast
  primary: '#DA7756',            // Lighter Crail for dark mode
  secondary: '#F59E0B',          // Bright amber
  success: '#22C55E',            // Bright green
  warning: '#FBBF24',            // Bright amber
  error: '#EF4444',              // Bright red

  // Interactive states - Warm light overlays
  pressedOverlay: 'rgba(218, 119, 86, 0.15)',
  hoverOverlay: 'rgba(218, 119, 86, 0.08)',
};
