/**
 * Input: AudioPlaybackService, playback controls
 * Output: Playback state management with Zustand
 * Pos: Global store for audio playback state and controls
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { create } from 'zustand';
import { audioPlaybackService, type PlaybackState } from '../../../core/services';

export interface PlaybackStoreState extends PlaybackState {
  // Current playing file
  currentUri: string | null;

  // Error handling
  error: string | null;

  // Actions
  play: (uri: string) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  clearError: () => void;
}

/**
 * Playback store using Zustand
 * Manages audio playback state and controls
 */
export const usePlaybackStore = create<PlaybackStoreState>((set, get) => ({
  // Initial state
  isLoaded: false,
  isPlaying: false,
  positionMillis: 0,
  durationMillis: 0,
  volume: 1.0,
  currentUri: null,
  error: null,

  /**
   * Play audio file
   */
  play: async (uri: string) => {
    try {
      console.log('[PlaybackStore] Playing:', uri);
      set({ error: null, currentUri: uri });
      await audioPlaybackService.play(uri);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Playback failed';
      console.error('[PlaybackStore] Play error:', message);
      set({ error: message, isPlaying: false });
    }
  },

  /**
   * Pause playback
   */
  pause: async () => {
    try {
      console.log('[PlaybackStore] Pausing');
      set({ error: null });
      await audioPlaybackService.pause();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pause failed';
      console.error('[PlaybackStore] Pause error:', message);
      set({ error: message });
    }
  },

  /**
   * Stop playback
   */
  stop: async () => {
    try {
      console.log('[PlaybackStore] Stopping');
      set({ error: null });
      await audioPlaybackService.stop();
      set({ currentUri: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stop failed';
      console.error('[PlaybackStore] Stop error:', message);
      set({ error: message });
    }
  },

  /**
   * Seek to position
   */
  seek: async (positionMillis: number) => {
    try {
      console.log('[PlaybackStore] Seeking to:', positionMillis);
      set({ error: null });
      await audioPlaybackService.seek(positionMillis);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Seek failed';
      console.error('[PlaybackStore] Seek error:', message);
      set({ error: message });
    }
  },

  /**
   * Set volume
   */
  setVolume: async (volume: number) => {
    try {
      console.log('[PlaybackStore] Setting volume to:', volume);
      set({ error: null });
      await audioPlaybackService.setVolume(volume);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Set volume failed';
      console.error('[PlaybackStore] Set volume error:', message);
      set({ error: message });
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },
}));

// Subscribe to playback service updates
audioPlaybackService.addListener((state: PlaybackState) => {
  usePlaybackStore.setState({
    isLoaded: state.isLoaded,
    isPlaying: state.isPlaying,
    positionMillis: state.positionMillis,
    durationMillis: state.durationMillis,
    volume: state.volume,
  });
});
