/**
 * Input: None (barrel export file)
 * Output: Theme system exports
 * Pos: Central export point for theme functionality
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

export { ThemeProvider, useTheme } from './ThemeProvider';
export type { ThemeMode } from './ThemeProvider';
export { lightColors, darkColors } from './colors';
export type { ThemeColors } from './colors';
