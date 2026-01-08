/**
 * Input: Audio amplitude levels, animation state
 * Output: Animated waveform visualization
 * Pos: Real-time audio waveform shown during recording
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface WaveformProps {
  isActive: boolean;
  barCount?: number;
}

const BAR_COUNT = 5;
const MIN_HEIGHT = 8;
const MAX_HEIGHT = 40;

function WaveformBar({ index, isActive }: { index: number; isActive: boolean }) {
  const { colors } = useTheme();
  const height = useSharedValue(MIN_HEIGHT);

  useEffect(() => {
    if (isActive) {
      const delay = index * 100;
      const duration = 300 + Math.random() * 200;

      height.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(MAX_HEIGHT * (0.4 + Math.random() * 0.6), {
              duration,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(MIN_HEIGHT + Math.random() * 10, {
              duration,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          true
        )
      );
    } else {
      height.value = withTiming(MIN_HEIGHT, { duration: 200 });
    }
  }, [isActive, index, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
        { backgroundColor: colors.waveform },
      ]}
    />
  );
}

export function Waveform({ isActive, barCount = BAR_COUNT }: WaveformProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: barCount }).map((_, index) => (
        <WaveformBar key={index} index={index} isActive={isActive} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: MAX_HEIGHT,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
