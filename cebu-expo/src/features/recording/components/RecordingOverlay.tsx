/**
 * Input: useRecording hook, user interactions
 * Output: Full-screen recording overlay UI (simplified for testing)
 * Pos: Modal overlay shown during recording
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React from 'react';
import { StyleSheet, View, Text, Modal, StatusBar } from 'react-native';
import { RecordButton } from './RecordButton';
import { WaveformVisualizer } from './WaveformVisualizer';
import { useRecording } from '../hooks/useRecording';
import { useTheme } from '../../../ui/theme';

interface RecordingOverlayProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Full-screen recording overlay (auto-starts recording when opened)
 */
export const RecordingOverlay: React.FC<RecordingOverlayProps> = ({
  visible,
  onClose,
}) => {
  const { colors, effectiveTheme } = useTheme();
  const {
    isRecording,
    isProcessing,
    formattedDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    lastTranscription,
  } = useRecording();

  // Auto-start recording when overlay becomes visible
  React.useEffect(() => {
    if (visible && !isRecording && !isProcessing) {
      startRecording();
    }
  }, [visible]);

  const handleButtonPress = async () => {
    if (isRecording) {
      await stopRecording();
      setTimeout(() => onClose(), 500);
    }
  };

  const handleCancel = async () => {
    await cancelRecording();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <StatusBar barStyle={effectiveTheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          {/* Status text */}
          <Text style={[styles.statusText, { color: colors.text }]}>
            {isProcessing ? '正在转录...' : '录音中'}
          </Text>

          {/* Duration display */}
          {isRecording && (
            <Text style={[styles.durationText, { color: colors.primary }]}>{formattedDuration}</Text>
          )}

          {/* Waveform visualizer */}
          <View style={styles.waveformContainer}>
            <WaveformVisualizer
              isActive={isRecording}
              barCount={7}
              barWidth={6}
              barSpacing={8}
              minHeight={12}
              maxHeight={60}
              color={colors.primary}
            />
          </View>

          {/* Record button */}
          <View style={styles.buttonContainer}>
            <RecordButton
              isRecording={isRecording}
              isProcessing={isProcessing}
              onPress={handleButtonPress}
              size={100}
            />
          </View>

          {/* Transcription result preview */}
          {lastTranscription && !isRecording && (
            <View style={[styles.transcriptionContainer, { backgroundColor: colors.glassBackground }]}>
              <Text style={[styles.transcriptionLabel, { color: colors.textSecondary }]}>转录结果：</Text>
              <Text style={[styles.transcriptionText, { color: colors.text }]}>{lastTranscription}</Text>
            </View>
          )}

          {/* Hint text */}
          {!isRecording && !isProcessing && (
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              {lastTranscription ? '点击关闭' : '点击麦克风开始录音'}
            </Text>
          )}

          {/* Cancel button */}
          {isRecording && (
            <Text style={[styles.cancelText, { color: colors.error }]} onPress={handleCancel}>
              取消
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  durationText: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 32,
    fontVariant: ['tabular-nums'],
  },
  waveformContainer: {
    marginBottom: 48,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  transcriptionContainer: {
    borderRadius: 20,  // Rounder (was 16)
    padding: 24,       // More spacious (was 20)
    marginTop: 40,     // More separation (was 32)
    maxWidth: '85%',   // More focused (was 90%)
  },
  transcriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 8,
  },
  transcriptionText: {
    fontSize: 18,
    lineHeight: 28,    // More relaxed (was 26)
    textAlign: 'center',
  },
  hintText: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 24,
  },
  cancelText: {
    fontSize: 18,
    marginTop: 32,
    fontWeight: '600',
  },
});
