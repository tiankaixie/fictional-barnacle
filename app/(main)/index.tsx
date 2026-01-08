/**
 * Input: Journal entries from database, WhisperKit transcription
 * Output: Main journal view with voice input and infinite scroll
 * Pos: Primary screen - displays today's journal with voice recording
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JournalList } from '../../src/components/journal/JournalList';
import { VoiceInputButton } from '../../src/components/recording/VoiceInputButton';
import { RecordingOverlay } from '../../src/components/recording/RecordingOverlay';
import { useTheme } from '../../src/hooks/useTheme';
import { useJournalStore } from '../../src/stores/journalStore';

export default function JournalScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const { addTranscription } = useJournalStore();

  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    setLiveTranscript('');
  }, []);

  const handleStopRecording = useCallback(async () => {
    setIsRecording(false);
    if (liveTranscript.trim()) {
      await addTranscription(liveTranscript.trim());
    }
    setLiveTranscript('');
  }, [liveTranscript, addTranscription]);

  const handleTranscriptUpdate = useCallback((text: string) => {
    setLiveTranscript(text);
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
