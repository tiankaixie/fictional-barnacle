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
      {/* Base gradient background - more pronounced */}
      <LinearGradient
        colors={[
          colors.background,
          colors.backgroundSecondary,
          colors.background,
        ]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Radial-like accent gradient from top */}
      <LinearGradient
        colors={[
          colors.glassHighlight + '25', // Warmer glow from top
          'transparent',
          'transparent',
        ]}
        locations={[0, 0.3, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle bottom shadow for depth */}
      <LinearGradient
        colors={[
          'transparent',
          'transparent',
          colors.glassShadow + '12', // Subtle depth at bottom
        ]}
        locations={[0, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

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
