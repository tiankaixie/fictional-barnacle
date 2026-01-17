/**
 * Input: React children, gradient colors
 * Output: Full-screen background with animated gradient
 * Pos: Screen-level background component for liquid glass aesthetic
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      {/* Solid background - clean and simple */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />

      {/* Glass orbs - subtle decorative elements */}
      {/* Top-right orb */}
      <View style={[styles.glassOrb, {
        width: 300,
        height: 300,
        top: -100,
        right: -100,
        backgroundColor: colors.glassHighlight,
        opacity: 0.15,
      }]} />

      {/* Middle-left orb */}
      <View style={[styles.glassOrb, {
        width: 250,
        height: 250,
        top: '35%',
        left: -80,
        backgroundColor: colors.primary,
        opacity: 0.08,
      }]} />

      {/* Bottom-center orb */}
      <View style={[styles.glassOrb, {
        width: 200,
        height: 200,
        bottom: -60,
        left: '50%',
        marginLeft: -100,
        backgroundColor: colors.glassHighlight,
        opacity: 0.12,
      }]} />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden', // Clip orbs at edges
  },
  glassOrb: {
    position: 'absolute',
    borderRadius: 9999, // Perfect circle
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
});
