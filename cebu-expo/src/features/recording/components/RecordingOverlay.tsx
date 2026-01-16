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

interface RecordingOverlayProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Full-screen recording overlay (simplified without animations)
 */
export const RecordingOverlay: React.FC<RecordingOverlayProps> = ({
  visible,
  onClose,
}) => {
  const {
    isRecording,
    isProcessing,
    formattedDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    lastTranscription,
  } = useRecording();

  const handleButtonPress = async () => {
    if (isRecording) {
      await stopRecording();
      setTimeout(() => onClose(), 500);
    } else {
      await startRecording();
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
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Status text */}
          <Text style={styles.statusText}>
            {isProcessing ? '正在转录...' : isRecording ? '录音中' : '准备录音'}
          </Text>

          {/* Duration display */}
          {isRecording && (
            <Text style={styles.durationText}>{formattedDuration}</Text>
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
              color="#007AFF"
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
            <View style={styles.transcriptionContainer}>
              <Text style={styles.transcriptionLabel}>转录结果：</Text>
              <Text style={styles.transcriptionText}>{lastTranscription}</Text>
            </View>
          )}

          {/* Hint text */}
          {!isRecording && !isProcessing && (
            <Text style={styles.hintText}>
              {lastTranscription ? '点击关闭' : '点击麦克风开始录音'}
            </Text>
          )}

          {/* Cancel button */}
          {isRecording && (
            <Text style={styles.cancelText} onPress={handleCancel}>
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
    backgroundColor: '#000000',
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
    color: '#FFFFFF',
    marginBottom: 16,
  },
  durationText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#007AFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    maxWidth: '90%',
  },
  transcriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 8,
  },
  transcriptionText: {
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 26,
  },
  hintText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.6,
    marginTop: 24,
  },
  cancelText: {
    fontSize: 18,
    color: '#FF453A',
    marginTop: 32,
    fontWeight: '600',
  },
});
