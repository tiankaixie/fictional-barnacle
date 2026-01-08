/**
 * Input: Recording state, onPress callback
 * Output: Liquid Glass styled voice input button with glow effects
 * Pos: Main recording trigger button shown on journal screen
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { MicrophoneIcon } from '../ui/Icons';

interface VoiceInputButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function VoiceInputButton({
  isRecording,
  onPress,
  disabled,
}: VoiceInputButtonProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const innerGlow = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      // Outer pulse
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.6, { damping: 6, stiffness: 60 }),
          withSpring(1.2, { damping: 6, stiffness: 60 })
        ),
        -1,
        true
      );
      pulseOpacity.value = withSpring(0.4);

      // Inner glow animation
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      innerGlow.value = withSpring(1);
    } else {
      pulseScale.value = withSpring(1);
      pulseOpacity.value = withSpring(0);
      glowIntensity.value = withTiming(0);
      innerGlow.value = withSpring(0);
    }
  }, [isRecording, pulseScale, pulseOpacity, glowIntensity, innerGlow]);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.92, { damping: 12 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    onPress();
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value * 0.6,
    transform: [{ scale: 1 + glowIntensity.value * 0.1 }],
  }));

  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: innerGlow.value * 0.8,
  }));

  return (
    <View style={styles.container}>
      {/* Outer glow pulse */}
      <Animated.View
        style={[
          styles.pulse,
          pulseStyle,
          { backgroundColor: isRecording ? colors.recordingGlow : colors.primaryGlow },
        ]}
      />

      {/* Secondary glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          glowStyle,
          {
            borderColor: isRecording ? colors.recordingRed : colors.primary,
            shadowColor: isRecording ? colors.recordingRed : colors.primary,
          },
        ]}
      />

      <AnimatedPressable
        onPress={handlePress}
        disabled={disabled}
        style={[buttonStyle, styles.buttonWrapper]}
      >
        {/* Glass background */}
        <View style={styles.glassContainer}>
          <BlurView
            intensity={isDark ? 60 : 40}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blur}
          >
            {/* Gradient overlay for depth */}
            <View
              style={[
                styles.gradientOverlay,
                {
                  backgroundColor: isRecording
                    ? colors.recordingRed
                    : colors.primary,
                },
              ]}
            />

            {/* Inner highlight */}
            <View
              style={[
                styles.innerHighlight,
                { borderColor: colors.glassHighlight },
              ]}
            />

            {/* Inner glow when recording */}
            <Animated.View
              style={[
                styles.innerGlowEffect,
                innerGlowStyle,
                { backgroundColor: colors.recordingGlow },
              ]}
            />

            {/* Icon */}
            <View style={styles.iconContainer}>
              <MicrophoneIcon
                size={28}
                color="#FFFFFF"
                isRecording={isRecording}
              />
            </View>
          </BlurView>
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  pulse: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  glowRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  buttonWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  glassContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
  },
  blur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  innerGlowEffect: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
  },
  iconContainer: {
    zIndex: 10,
  },
});
