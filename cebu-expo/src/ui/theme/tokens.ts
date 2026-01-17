/**
 * Input: None (design token definitions)
 * Output: Comprehensive design tokens
 * Pos: Comprehensive token system for Claude-style UI
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import type { ViewStyle } from 'react-native';

/**
 * Comprehensive design tokens for Claude-style UI
 */
export const tokens = {
  // Border radius - more generous than iOS
  radius: {
    sm: 8,
    md: 12,
    lg: 16,    // Cards (Claude uses rounder corners)
    xl: 20,    // Modals
    xxl: 24,   // Sheets
    full: 9999,
  },

  // Shadow presets - warm brown tints
  shadows: {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    } as ViewStyle,
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 12,    // Softer (was 8)
      elevation: 4,
    } as ViewStyle,
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    } as ViewStyle,
  },

  // Blur intensities
  blur: {
    light: 10,
    medium: 15,   // Cards
    heavy: 20,    // Emphasis
  },

  // Animation durations (milliseconds)
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
} as const;

export type Tokens = typeof tokens;
