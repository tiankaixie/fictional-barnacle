/**
 * Input: Size, color, and state props
 * Output: SVG icon components for the app
 * Pos: Reusable icon components (using View-based shapes)
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

interface IconProps {
  size?: number;
  color?: string;
}

interface MicrophoneIconProps extends IconProps {
  isRecording?: boolean;
}

export function MicrophoneIcon({ size = 24, color = '#000', isRecording }: MicrophoneIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1);
    }
  }, [isRecording, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.micContainer, animatedStyle, { width: size, height: size }]}>
      {/* Microphone body */}
      <View
        style={[
          styles.micBody,
          {
            width: size * 0.4,
            height: size * 0.55,
            backgroundColor: color,
            borderRadius: size * 0.2,
          },
        ]}
      />
      {/* Microphone stand arc */}
      <View
        style={[
          styles.micArc,
          {
            width: size * 0.6,
            height: size * 0.35,
            borderColor: color,
            borderWidth: size * 0.08,
            borderTopWidth: 0,
            borderRadius: size * 0.3,
            top: size * 0.4,
          },
        ]}
      />
      {/* Microphone stand */}
      <View
        style={[
          styles.micStand,
          {
            width: size * 0.08,
            height: size * 0.15,
            backgroundColor: color,
            top: size * 0.72,
          },
        ]}
      />
    </Animated.View>
  );
}

export function StopIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <View style={[styles.stopContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.stopSquare,
          {
            width: size * 0.5,
            height: size * 0.5,
            backgroundColor: color,
            borderRadius: size * 0.08,
          },
        ]}
      />
    </View>
  );
}

export function EditIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <View style={[styles.editContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.editPencil,
          {
            width: size * 0.15,
            height: size * 0.6,
            backgroundColor: color,
            borderRadius: size * 0.05,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  micContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  micBody: {
    position: 'absolute',
    top: 0,
  },
  micArc: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  micStand: {
    position: 'absolute',
  },
  stopContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: {},
  editContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPencil: {},
});
