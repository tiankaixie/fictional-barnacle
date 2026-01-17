/**
 * Input: None (spacing definitions)
 * Output: Spacing design tokens
 * Pos: Spacing token system based on 4px grid
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

/**
 * Spacing design tokens based on 4px grid
 */
export const spacing = {
  // Base scale (4px unit)
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,

  // Semantic spacing
  cardPadding: 16,      // Standard card padding
  screenPadding: 20,    // Screen horizontal padding
  sectionGap: 24,       // Gap between sections
  itemGap: 12,          // Gap between list items
  buttonGap: 8,         // Gap between button icon and text
} as const;

export type Spacing = typeof spacing;
