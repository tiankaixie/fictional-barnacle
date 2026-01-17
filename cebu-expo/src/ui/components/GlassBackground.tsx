/**
 * Input: React children
 * Output: Full-screen solid background
 * Pos: Screen-level background component for Claude aesthetic
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface GlassBackgroundProps {
  children: ReactNode;
}

/**
 * Full-screen liquid glass background with gradient
 */
export const GlassBackground: React.FC<GlassBackgroundProps> = ({ children }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Pure solid background - clean Claude style */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
});
