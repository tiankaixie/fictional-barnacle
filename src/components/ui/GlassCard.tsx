/**
 * Input: Children, style props
 * Output: Liquid Glass styled card with blur effect
 * Pos: Reusable glass morphism card component
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  interpolate,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'heavy';
  borderRadius?: number;
  padding?: number;
  showHighlight?: boolean;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function GlassCard({
  children,
  style,
  intensity = 'medium',
  borderRadius = 20,
  padding = 16,
  showHighlight = true,
}: GlassCardProps) {
  const { colors, isDark } = useTheme();

  const blurAmount = {
    light: isDark ? 40 : 30,
    medium: isDark ? 60 : 50,
    heavy: isDark ? 80 : 70,
  }[intensity];

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius,
          shadowColor: colors.glassShadow,
        },
        style,
      ]}
    >
      <BlurView
        intensity={blurAmount}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.blur,
          {
            borderRadius,
            backgroundColor: colors.glassBackground,
          },
        ]}
      >
        {/* Inner highlight border */}
        {showHighlight && (
          <View
            style={[
              styles.highlightBorder,
              {
                borderRadius,
                borderColor: colors.glassBorder,
              },
            ]}
          />
        )}

        {/* Top edge highlight for 3D effect */}
        {showHighlight && (
          <View
            style={[
              styles.topHighlight,
              {
                borderTopLeftRadius: borderRadius,
                borderTopRightRadius: borderRadius,
                backgroundColor: colors.glassHighlight,
              },
            ]}
          />
        )}

        {/* Content */}
        <View style={[styles.content, { padding }]}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
  blur: {
    overflow: 'hidden',
  },
  highlightBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    pointerEvents: 'none',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.5,
  },
  content: {},
});
