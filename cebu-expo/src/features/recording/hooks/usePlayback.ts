/**
 * Input: PlaybackStore, AudioPlaybackService
 * Output: Playback hook with formatted time and convenience methods
 * Pos: React hook that provides audio playback controls and state
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { useEffect, useCallback } from 'react';
import { usePlaybackStore } from '../stores/playbackStore';
import { audioPlaybackService } from '../../../core/services';

/**
 * Playback hook that provides audio playback controls and state
 * Handles initialization and provides formatted time display
 */
export const usePlayback = (audioUri?: string) => {
  const {
    isLoaded,
    isPlaying,
    positionMillis,
    durationMillis,
    volume,
    currentUri,
    error,
    play,
    pause,
    stop,
    seek,
    setVolume,
    clearError,
  } = usePlaybackStore();

  // Initialize playback service on mount
  useEffect(() => {
    audioPlaybackService.initialize().catch((error) => {
      console.error('[usePlayback] Initialization error:', error);
    });
  }, []);

  // Check if this audio is currently playing
  const isThisPlaying = useCallback(() => {
    if (!audioUri) return false;
    return currentUri === audioUri && isPlaying;
  }, [audioUri, currentUri, isPlaying]);

  // Check if this audio is currently loaded (playing or paused)
  const isThisLoaded = useCallback(() => {
    if (!audioUri) return false;
    return currentUri === audioUri && isLoaded;
  }, [audioUri, currentUri, isLoaded]);

  // Toggle play/pause for the given audio
  const togglePlayPause = useCallback(async () => {
    if (!audioUri) return;

    try {
      // If this audio is playing, pause it
      if (isThisPlaying()) {
        await pause();
        return;
      }

      // If this audio is loaded but paused, resume it
      if (isThisLoaded() && !isPlaying) {
        await play(audioUri);
        return;
      }

      // Otherwise, stop any current playback and play this audio
      if (currentUri && currentUri !== audioUri) {
        await stop();
      }
      await play(audioUri);
    } catch (error) {
      console.error('[usePlayback] Toggle play/pause error:', error);
    }
  }, [audioUri, currentUri, isPlaying, isThisPlaying, isThisLoaded, play, pause, stop]);

  // Format time in mm:ss format
  const formatTime = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Format position and duration
  const formattedPosition = formatTime(positionMillis);
  const formattedDuration = formatTime(durationMillis);

  // Calculate progress percentage (0-100)
  const progress = durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0;

  return {
    // State
    isLoaded,
    isPlaying: isThisPlaying(),
    isThisLoaded: isThisLoaded(),
    positionMillis,
    durationMillis,
    volume,
    currentUri,
    error,

    // Formatted values
    formattedPosition,
    formattedDuration,
    progress,

    // Actions
    play,
    pause,
    stop,
    seek,
    setVolume,
    clearError,
    togglePlayPause,

    // Utility methods
    formatTime,
  };
};
