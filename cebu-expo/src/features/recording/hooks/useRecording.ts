/**
 * Input: RecordingStore, JournalRepository, AudioStorageService
 * Output: Recording hook with save-to-database integration
 * Pos: React hook that connects recording flow to data persistence
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRecordingStore } from '../stores/recordingStore';
import { JournalRepository, UserRepository } from '../../../core/data/repositories';
import { audioStorageService } from '../../../core/services/AudioStorageService';
import { useEffect } from 'react';

/**
 * Recording hook that integrates store with data persistence
 * Handles the complete flow: record → transcribe → save to database
 */
export const useRecording = () => {
  const queryClient = useQueryClient();
  const {
    isRecording,
    isProcessing,
    isInitialized,
    hasPermission,
    recordingDurationMs,
    lastTranscription,
    error,
    initialize,
    requestPermissions,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
  } = useRecordingStore();

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize().catch((error) => {
        console.error('[useRecording] Initialization error:', error);
      });
    }
  }, [isInitialized, initialize]);

  // Save recording mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Stop recording and get transcription
      const result = await stopRecording();

      // Get current user
      const user = await UserRepository.getOrCreateLocalUser();

      // Get or create today's entry
      const entry = await JournalRepository.getOrCreateTodayEntry(user.id);

      // Save transcription block
      const block = await JournalRepository.addTranscriptionBlock(
        entry,
        result.text,
        result.durationMs
      );

      // Save audio file if enabled
      if (audioStorageService.isSaveEnabled() && result.samples.length > 0) {
        const audioInfo = await audioStorageService.saveAudio(
          result.samples,
          block.id,
          entry.id,
          16000, // Sample rate
          result.uri // Original recording file URI
        );

        // Update block with audio metadata
        await JournalRepository.updateBlockAudioMetadata(
          block,
          audioInfo.path,
          audioInfo.size,
          audioInfo.format
        );
      }

      return {
        block,
        transcription: result.text,
      };
    },
    onSuccess: (data) => {
      console.log('[useRecording] ★★★ SAVE SUCCESS V2.0 - WITH AUTO REFRESH ★★★');
      console.log('[useRecording] Saved transcription:', data.transcription);
      // Invalidate journal queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      console.log('[useRecording] Invalidated journal-entries query');
    },
    onError: (error) => {
      console.error('[useRecording] Save failed:', error);
    },
  });

  // Start recording handler
  const handleStartRecording = async () => {
    try {
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) {
          return;
        }
      }
      await startRecording();
    } catch (error) {
      console.error('[useRecording] Start error:', error);
    }
  };

  // Stop recording and save handler
  const handleStopRecording = async () => {
    saveMutation.mutate();
  };

  // Cancel recording handler
  const handleCancelRecording = async () => {
    try {
      await cancelRecording();
    } catch (error) {
      console.error('[useRecording] Cancel error:', error);
    }
  };

  // Format duration for display
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    // State
    isRecording,
    isProcessing: isProcessing || saveMutation.isPending,
    isInitialized,
    hasPermission,
    recordingDurationMs,
    formattedDuration: formatDuration(recordingDurationMs),
    lastTranscription,
    error: error || (saveMutation.error ? String(saveMutation.error) : null),
    isSaving: saveMutation.isPending,
    saveSuccess: saveMutation.isSuccess,

    // Actions
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    cancelRecording: handleCancelRecording,
    requestPermissions,
    clearError,

    // Mutation state
    saveMutation,
  };
};
