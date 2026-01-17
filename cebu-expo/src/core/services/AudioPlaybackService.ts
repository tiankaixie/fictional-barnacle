/**
 * Input: Audio file paths from storage, playback controls
 * Output: Audio playback with position tracking and state management
 * Pos: Manages audio playback using expo-av with singleton pattern
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const documentDirectory = (FileSystem as any).documentDirectory as string | null;

export interface PlaybackState {
  isLoaded: boolean;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  volume: number;
}

export type PlaybackCallback = (state: PlaybackState) => void;

/**
 * Audio playback service for playing recorded audio files
 */
export class AudioPlaybackService {
  private static instance: AudioPlaybackService;
  private sound: Audio.Sound | null = null;
  private currentUri: string | null = null;
  private callbacks: Set<PlaybackCallback> = new Set();

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): AudioPlaybackService {
    if (!AudioPlaybackService.instance) {
      AudioPlaybackService.instance = new AudioPlaybackService();
    }
    return AudioPlaybackService.instance;
  }

  /**
   * Initialize audio session for playback
   */
  async initialize(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('[AudioPlaybackService] Initialized');
    } catch (error) {
      console.error('[AudioPlaybackService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register a callback for playback state updates
   */
  addListener(callback: PlaybackCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(state: PlaybackState): void {
    this.callbacks.forEach(callback => callback(state));
  }

  /**
   * Get current playback state
   */
  private async getCurrentState(): Promise<PlaybackState> {
    if (!this.sound) {
      return {
        isLoaded: false,
        isPlaying: false,
        positionMillis: 0,
        durationMillis: 0,
        volume: 1.0,
      };
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        return {
          isLoaded: true,
          isPlaying: status.isPlaying,
          positionMillis: status.positionMillis,
          durationMillis: status.durationMillis || 0,
          volume: status.volume || 1.0,
        };
      }
    } catch (error) {
      console.error('[AudioPlaybackService] Failed to get status:', error);
    }

    return {
      isLoaded: false,
      isPlaying: false,
      positionMillis: 0,
      durationMillis: 0,
      volume: 1.0,
    };
  }

  /**
   * Handle playback status updates
   */
  private onPlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      this.notifyListeners({
        isLoaded: true,
        isPlaying: status.isPlaying,
        positionMillis: status.positionMillis,
        durationMillis: status.durationMillis || 0,
        volume: status.volume || 1.0,
      });

      // Auto-stop when playback finishes
      if (status.didJustFinish) {
        await this.stop();
      }
    }
  };

  /**
   * Load and play audio file
   */
  async play(relativeUri: string): Promise<void> {
    try {
      console.log('[AudioPlaybackService] Playing:', relativeUri);

      // Convert relative path to absolute path
      const absoluteUri = documentDirectory
        ? `${documentDirectory}${relativeUri}`
        : relativeUri;

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(absoluteUri);
      if (!fileInfo.exists) {
        throw new Error(`Audio file not found: ${absoluteUri}`);
      }

      // If playing the same file, just resume
      if (this.currentUri === absoluteUri && this.sound) {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await this.sound.playAsync();
          return;
        }
      }

      // Unload previous sound if different file
      if (this.currentUri !== absoluteUri) {
        await this.unload();
        this.currentUri = absoluteUri;

        // Create new sound
        const { sound } = await Audio.Sound.createAsync(
          { uri: absoluteUri },
          { shouldPlay: true, volume: 1.0 },
          this.onPlaybackStatusUpdate
        );

        this.sound = sound;
      }
    } catch (error) {
      console.error('[AudioPlaybackService] Play failed:', error);
      throw error;
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
        console.log('[AudioPlaybackService] Paused');
      }
    } catch (error) {
      console.error('[AudioPlaybackService] Pause failed:', error);
      throw error;
    }
  }

  /**
   * Stop playback and reset position
   */
  async stop(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.setPositionAsync(0);
        console.log('[AudioPlaybackService] Stopped');

        // Notify listeners of stopped state
        const state = await this.getCurrentState();
        this.notifyListeners(state);
      }
    } catch (error) {
      console.error('[AudioPlaybackService] Stop failed:', error);
      throw error;
    }
  }

  /**
   * Seek to position in milliseconds
   */
  async seek(positionMillis: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setPositionAsync(positionMillis);
        console.log('[AudioPlaybackService] Seeked to:', positionMillis);
      }
    } catch (error) {
      console.error('[AudioPlaybackService] Seek failed:', error);
      throw error;
    }
  }

  /**
   * Set volume (0.0 - 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
        console.log('[AudioPlaybackService] Volume set to:', volume);
      }
    } catch (error) {
      console.error('[AudioPlaybackService] Set volume failed:', error);
      throw error;
    }
  }

  /**
   * Unload current sound
   */
  async unload(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
        this.currentUri = null;
        console.log('[AudioPlaybackService] Unloaded');

        // Notify listeners of unloaded state
        this.notifyListeners({
          isLoaded: false,
          isPlaying: false,
          positionMillis: 0,
          durationMillis: 0,
          volume: 1.0,
        });
      }
    } catch (error) {
      console.error('[AudioPlaybackService] Unload failed:', error);
      throw error;
    }
  }

  /**
   * Get current playing URI
   */
  getCurrentUri(): string | null {
    return this.currentUri;
  }

  /**
   * Check if a specific file is currently playing
   */
  isPlaying(relativeUri: string): boolean {
    if (!this.currentUri || !documentDirectory) return false;
    const absoluteUri = `${documentDirectory}${relativeUri}`;
    return this.currentUri === absoluteUri;
  }
}

// Export singleton instance
export const audioPlaybackService = AudioPlaybackService.getInstance();
