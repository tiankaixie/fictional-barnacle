/**
 * Input: Color, size, duration props
 * Output: Animated pulsing glow effect
 * Pos: Decorative animation component for ambient effects
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PulsingGlowProps {
  color?: string;
  size?: number;
  duration?: number;
  style?: ViewStyle;
}

/**
 * Pulsing glow animation with radial gradient
 */
export const PulsingGlow: React.FC<PulsingGlowProps> = ({
  color = '#007AFF',
  size = 120,
  duration = 2000,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Create pulsing animation
    const pulseAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [scaleAnim, opacityAnim, duration]);

  const gradientColors = [
    color + 'CC',
    color + '99',
    color + '44',
    color + '00',
  ];

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Animated.View
        style={[
          styles.glow,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { width: size, height: size, borderRadius: size / 2 }]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  glow: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});
