/**
 * Input: AudioRecordingService, MockASRService
 * Output: Recording state management with Zustand
 * Pos: Global store for recording lifecycle and transcription state
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { create } from 'zustand';
import { audioRecordingService } from '../../../core/services/AudioRecordingService';
import { MockASRService } from '../../../core/services/MockASRService';

export interface RecordingState {
  // Recording state
  isRecording: boolean;
  isProcessing: boolean;
  isInitialized: boolean;
  hasPermission: boolean;

  // Recording data
  recordingDurationMs: number;
  currentUri: string | null;

  // Transcription result
  lastTranscription: string | null;
  lastSamples: Float32Array | null;

  // Error handling
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{
    text: string;
    samples: Float32Array;
    durationMs: number;
  }>;
  cancelRecording: () => Promise<void>;
  updateDuration: () => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Recording store using Zustand
 * Manages recording lifecycle, permissions, and transcription
 */
export const useRecordingStore = create<RecordingState>((set, get) => ({
  // Initial state
  isRecording: false,
  isProcessing: false,
  isInitialized: false,
  hasPermission: false,
  recordingDurationMs: 0,
  currentUri: null,
  lastTranscription: null,
  lastSamples: null,
  error: null,

  /**
   * Initialize ASR service
   */
  initialize: async () => {
    try {
      if (get().isInitialized) {
        return;
      }

      // Initialize mock ASR service
      await MockASRService.initialize();

      // Check microphone permissions
      const hasPermission = await audioRecordingService.hasPermissions();

      set({
        isInitialized: true,
        hasPermission,
        error: null,
      });

      console.log('[RecordingStore] Initialized');
    } catch (error) {
      set({
        error: `Initialization failed: ${error}`,
        isInitialized: false,
      });
      throw error;
    }
  },

  /**
   * Request microphone permissions
   */
  requestPermissions: async () => {
    try {
      const granted = await audioRecordingService.requestPermissions();

      set({
        hasPermission: granted,
        error: granted ? null : 'Microphone permission denied',
      });

      return granted;
    } catch (error) {
      set({
        error: `Permission request failed: ${error}`,
        hasPermission: false,
      });
      return false;
    }
  },

  /**
   * Start recording
   */
  startRecording: async () => {
    const state = get();

    if (state.isRecording) {
      throw new Error('Recording already in progress');
    }

    if (!state.isInitialized) {
      await get().initialize();
    }

    if (!state.hasPermission) {
      const granted = await get().requestPermissions();
      if (!granted) {
        throw new Error('Microphone permission required');
      }
    }

    try {
      await audioRecordingService.startRecording();

      set({
        isRecording: true,
        recordingDurationMs: 0,
        lastTranscription: null,
        lastSamples: null,
        error: null,
      });

      // Start duration timer
      const durationInterval = setInterval(() => {
        if (get().isRecording) {
          get().updateDuration();
        } else {
          clearInterval(durationInterval);
        }
      }, 100);

      console.log('[RecordingStore] Started recording');
    } catch (error) {
      set({
        error: `Failed to start recording: ${error}`,
        isRecording: false,
      });
      throw error;
    }
  },

  /**
   * Stop recording and transcribe
   */
  stopRecording: async () => {
    const state = get();

    if (!state.isRecording) {
      throw new Error('No recording in progress');
    }

    try {
      // Stop recording
      set({ isRecording: false, isProcessing: true });

      const result = await audioRecordingService.stopRecording();

      console.log(`[RecordingStore] Stopped recording: ${result.durationMs}ms, ${result.samples.length} samples`);

      // Transcribe with mock ASR
      const transcription = await MockASRService.decode(result.samples);

      set({
        isProcessing: false,
        lastTranscription: transcription.text,
        lastSamples: result.samples,
        currentUri: result.uri,
        recordingDurationMs: result.durationMs,
        error: null,
      });

      console.log(`[RecordingStore] Transcription: "${transcription.text}"`);

      return {
        text: transcription.text,
        samples: result.samples,
        durationMs: result.durationMs,
      };
    } catch (error) {
      set({
        isRecording: false,
        isProcessing: false,
        error: `Failed to stop recording: ${error}`,
      });
      throw error;
    }
  },

  /**
   * Cancel current recording
   */
  cancelRecording: async () => {
    try {
      await audioRecordingService.cancelRecording();

      set({
        isRecording: false,
        isProcessing: false,
        recordingDurationMs: 0,
        currentUri: null,
        lastTranscription: null,
        lastSamples: null,
        error: null,
      });

      console.log('[RecordingStore] Cancelled recording');
    } catch (error) {
      set({
        error: `Failed to cancel recording: ${error}`,
      });
    }
  },

  /**
   * Update recording duration
   */
  updateDuration: () => {
    const duration = audioRecordingService.getRecordingDuration();
    set({ recordingDurationMs: duration });
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set({
      isRecording: false,
      isProcessing: false,
      recordingDurationMs: 0,
      currentUri: null,
      lastTranscription: null,
      lastSamples: null,
      error: null,
    });
  },
}));
