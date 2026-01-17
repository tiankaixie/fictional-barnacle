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
      {/* Simple solid base - clean and minimal */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />

      {/* Subtle top-to-bottom gradient for depth */}
      <LinearGradient
        colors={[
          colors.backgroundSecondary + '40', // Very subtle highlight at top
          'transparent',
          colors.glassShadow + '08',         // Gentle shadow at bottom
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Soft warm accent in top-left corner */}
      <LinearGradient
        colors={[
          colors.glassHighlight + '20', // Gentle warm glow
          'transparent',
        ]}
        locations={[0, 0.5]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
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
