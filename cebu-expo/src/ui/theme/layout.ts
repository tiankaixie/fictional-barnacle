/**
 * Input: None (layout design tokens)
 * Output: Unified layout system for consistent spacing
 * Pos: Layout design tokens following Claude's design principles
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

/**
 * Unified layout system based on Claude's design principles:
 * - Generous spacing for breathing room
 * - Consistent padding across all screens
 * - Clear visual hierarchy
 */
export const layout = {
  // Screen-level padding
  screen: {
    horizontal: 24,   // Consistent horizontal padding
    top: 8,           // Minimal top padding (status bar handled by App)
    bottom: 16,       // Bottom padding before content
  },

  // Section spacing
  section: {
    gap: 32,          // Gap between major sections
    marginBottom: 24, // Bottom margin for sections
  },

  // Card spacing
  card: {
    margin: 16,       // Margin around cards
    padding: 20,      // Internal card padding
    gap: 16,          // Gap between card elements
  },

  // Header spacing
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    titleMarginBottom: 8,
  },

  // List spacing
  list: {
    padding: 12,      // List container padding
    itemGap: 12,      // Gap between list items
  },
} as const;

export type Layout = typeof layout;
