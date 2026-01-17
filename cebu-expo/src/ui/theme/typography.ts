/**
 * Input: None (typography definitions)
 * Output: Typography design tokens
 * Pos: Typography token system for Claude-style UI
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

/**
 * Typography design tokens following Claude's clear hierarchy
 */
export const typography = {
  // Font weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Font sizes - clear scale
  sizes: {
    h1: 32,      // Page titles
    h2: 24,      // Section titles
    h3: 20,      // Subsection titles
    body: 16,    // Default body text
    bodySmall: 14, // Secondary text
    caption: 12,  // Captions, labels
  },

  // Line heights - generous for readability
  lineHeights: {
    tight: 1.2,   // Headlines
    normal: 1.5,  // Body text
    relaxed: 1.7, // Long-form content
  },

  // Letter spacing
  tracking: {
    tight: -0.5,  // Large titles
    normal: 0,    // Default
    wide: 0.5,    // All caps labels
  },
} as const;

export type Typography = typeof typography;
