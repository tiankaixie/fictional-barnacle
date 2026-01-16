/**
 * Input: React children, style props
 * Output: Card component with liquid glass effect
 * Pos: Reusable glassmorphism card for content containers
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderRadius?: number;
}

/**
 * Liquid glass card component with blur and gradient effects
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 20,
  borderRadius = 12,
}) => {
  const { effectiveTheme, colors } = useTheme();

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      {/* Blur layer */}
      <BlurView
        intensity={intensity}
        tint={effectiveTheme}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />

      {/* Background gradient */}
      <LinearGradient
        colors={[colors.glassBackground, colors.backgroundSecondary + '99']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />

      {/* Border gradient */}
      <View style={[styles.border, { borderRadius }]}>
        <LinearGradient
          colors={[colors.glassHighlight, colors.glassBorder]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>

      {/* Shadow overlay */}
      <View
        style={[
          styles.shadow,
          {
            borderRadius,
            shadowColor: colors.glassShadow,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 1,
    opacity: 0.6,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  shadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
