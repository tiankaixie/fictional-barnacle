/**
 * Input: Recording visibility, live transcript, callbacks
 * Output: Liquid Glass styled full-screen recording overlay
 * Pos: Modal overlay shown when recording is active
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { Waveform } from './Waveform';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RecordingOverlayProps {
  visible: boolean;
  transcript: string;
  onTranscriptUpdate: (text: string) => void;
  onStop: () => void;
}

export function RecordingOverlay({
  visible,
  transcript,
  onTranscriptUpdate,
  onStop,
}: RecordingOverlayProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const dotPulse = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 300 });

    if (visible) {
      // Pulsing recording dot
      dotPulse.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Expanding ring animation
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.8, { duration: 1500, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1500 }),
          withTiming(0.5, { duration: 0 })
        ),
        -1
      );
    }
  }, [visible, opacity, dotPulse, ringScale, ringOpacity]);

  const handleStop = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onStop();
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotPulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.container, overlayStyle]}>
        <BlurView
          intensity={isDark ? 90 : 70}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurContainer}
        >
          {/* Glass panel background */}
          <View
            style={[
              styles.glassPanel,
              {
                backgroundColor: colors.glassBackground,
                paddingTop: insets.top + 20,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            {/* Header with recording indicator */}
            <View style={styles.header}>
              <View
                style={[
                  styles.recordingPill,
                  { backgroundColor: isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.1)' },
                ]}
              >
                <Animated.View
                  style={[
                    styles.recordingDot,
                    dotStyle,
                    { backgroundColor: colors.recordingRed },
                  ]}
                />
                <Text style={[styles.recordingText, { color: colors.recordingRed }]}>
                  Recording
                </Text>
              </View>
            </View>

            {/* Main content */}
            <View style={styles.content}>
              {/* Waveform with glass container */}
              <View
                style={[
                  styles.waveformContainer,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.03)',
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Waveform isActive={visible} barCount={9} />
              </View>

              {/* Transcript glass card */}
              <View
                style={[
                  styles.transcriptCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Text style={[styles.transcriptLabel, { color: colors.textTertiary }]}>
                  TRANSCRIBING
                </Text>
                <Text
                  style={[styles.transcript, { color: colors.text }]}
                  numberOfLines={4}
                >
                  {transcript || 'Start speaking...'}
                </Text>
              </View>
            </View>

            {/* Footer with stop button */}
            <View style={styles.footer}>
              <View style={styles.stopButtonContainer}>
                {/* Animated ring */}
                <Animated.View
                  style={[
                    styles.expandingRing,
                    ringStyle,
                    { borderColor: colors.recordingRed },
                  ]}
                />

                <Pressable onPress={handleStop} style={styles.stopButtonPressable}>
                  <BlurView
                    intensity={isDark ? 60 : 40}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.stopButtonBlur}
                  >
                    <View
                      style={[
                        styles.stopButtonInner,
                        { backgroundColor: colors.recordingRed },
                      ]}
                    >
                      <View style={styles.stopIcon} />
                    </View>
                    {/* Glass highlight */}
                    <View style={styles.stopButtonHighlight} />
                  </BlurView>
                </Pressable>
              </View>

              <Text style={[styles.stopHint, { color: colors.textSecondary }]}>
                Tap to stop recording
              </Text>
            </View>
          </View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
  },
  glassPanel: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recordingText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  waveformContainer: {
    width: SCREEN_WIDTH - 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptCard: {
    width: SCREEN_WIDTH - 48,
    minHeight: 140,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  transcriptLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  transcript: {
    fontSize: 22,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 32,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  stopButtonContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandingRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
  },
  stopButtonPressable: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  stopButtonBlur: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomColor: 'transparent',
  },
  stopIcon: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  stopHint: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
});
