/**
 * Input: Journal entries from database, WhisperKit transcription
 * Output: Main journal view with voice input and infinite scroll
 * Pos: Primary screen - displays today's journal with voice recording
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JournalList } from '../../src/components/journal/JournalList';
import { VoiceInputButton } from '../../src/components/recording/VoiceInputButton';
import { RecordingOverlay } from '../../src/components/recording/RecordingOverlay';
import { useTheme } from '../../src/hooks/useTheme';
import { useJournalStore } from '../../src/stores/journalStore';
import { useWhisperKit } from '../../src/hooks/useWhisperKit';

export default function JournalScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { addTranscription } = useJournalStore();

  // WhisperKit integration
  const {
    isInitialized,
    isRecording,
    liveTranscript,
    error,
    permissionGranted,
    startRecording,
    stopRecording,
  } = useWhisperKit();

  // Show error alerts
  useEffect(() => {
    if (error) {
      Alert.alert('Recording Error', error);
    }
  }, [error]);

  const handleStartRecording = useCallback(async () => {
    if (!permissionGranted) {
      Alert.alert(
        'Microphone Permission Required',
        'Please grant microphone permission to record voice notes.'
      );
      return;
    }

    if (!isInitialized) {
      Alert.alert('Loading', 'Voice recognition is still initializing...');
      return;
    }

    console.log('[JournalScreen] Starting recording...');
    await startRecording();
  }, [permissionGranted, isInitialized, startRecording]);

  const handleStopRecording = useCallback(async () => {
    console.log('[JournalScreen] Stopping recording...');
    const result = await stopRecording();

    if (result.text && result.text.trim()) {
      console.log('[JournalScreen] Saving transcription:', result.text);
      await addTranscription(result.text.trim());
    }
  }, [stopRecording, addTranscription]);

  const handleTranscriptUpdate = useCallback((text: string) => {
    // This is called from RecordingOverlay but we're using liveTranscript from WhisperKit
    console.log('[JournalScreen] Transcript update:', text);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <JournalList />

      <View
        style={[
          styles.voiceButtonContainer,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <VoiceInputButton
          isRecording={isRecording}
          onPress={isRecording ? handleStopRecording : handleStartRecording}
        />
      </View>

      <RecordingOverlay
        visible={isRecording}
        transcript={liveTranscript}
        onTranscriptUpdate={handleTranscriptUpdate}
        onStop={handleStopRecording}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  voiceButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 16,
  },
});
