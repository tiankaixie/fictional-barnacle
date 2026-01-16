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
      {/* Base gradient background */}
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle overlay gradient for depth */}
      <LinearGradient
        colors={[
          colors.glassHighlight + '20',
          'transparent',
          colors.glassShadow + '10',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
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
