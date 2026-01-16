/**
 * Input: expo-av Audio API, device microphone
 * Output: Audio recording management, PCM sample buffers
 * Pos: Handles audio capture at 16kHz mono for ASR processing
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

export interface RecordingResult {
  uri: string;
  durationMs: number;
  samples: Float32Array;
}

/**
 * Audio recording service using expo-av
 * Captures audio at 16kHz mono for speech recognition
 */
export class AudioRecordingService {
  private recording: Audio.Recording | null = null;
  private isRecording = false;
  private recordingStartTime = 0;

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[AudioRecording] Permission error:', error);
      return false;
    }
  }

  /**
   * Check if microphone permission is granted
   */
  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[AudioRecording] Permission check error:', error);
      return false;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      // Request permissions if not granted
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Microphone permission not granted');
        }
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create recording instance
      this.recording = new Audio.Recording();

      // Configure recording options for 16kHz mono (ASR optimized)
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      });

      // Start recording
      await this.recording.startAsync();
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      console.log('[AudioRecording] Started recording');
    } catch (error) {
      this.recording = null;
      this.isRecording = false;
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  /**
   * Stop recording and return result with audio samples
   */
  async stopRecording(): Promise<RecordingResult> {
    if (!this.isRecording || !this.recording) {
      throw new Error('No recording in progress');
    }

    try {
      // Stop recording
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      if (!uri) {
        throw new Error('Recording URI is null');
      }

      // Calculate duration
      const durationMs = Date.now() - this.recordingStartTime;

      console.log(`[AudioRecording] Stopped recording: ${uri} (${durationMs}ms)`);

      // Convert WAV file to Float32Array samples
      const samples = await this.wavToFloat32(uri);

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      this.recording = null;
      this.isRecording = false;

      return {
        uri,
        durationMs,
        samples,
      };
    } catch (error) {
      this.recording = null;
      this.isRecording = false;
      throw new Error(`Failed to stop recording: ${error}`);
    }
  }

  /**
   * Cancel current recording
   */
  async cancelRecording(): Promise<void> {
    if (!this.isRecording || !this.recording) {
      return;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      // Delete the recording file
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      this.recording = null;
      this.isRecording = false;

      console.log('[AudioRecording] Cancelled recording');
    } catch (error) {
      console.error('[AudioRecording] Error cancelling recording:', error);
      this.recording = null;
      this.isRecording = false;
    }
  }

  /**
   * Get current recording status
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get current recording duration in milliseconds
   */
  getRecordingDuration(): number {
    if (!this.isRecording) {
      return 0;
    }
    return Date.now() - this.recordingStartTime;
  }

  /**
   * Convert WAV file to Float32Array for ASR processing
   * @private
   */
  private async wavToFloat32(uri: string): Promise<Float32Array> {
    try {
      // Read WAV file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      // Convert base64 to Uint8Array
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Skip WAV header (44 bytes)
      const audioData = bytes.slice(44);

      // Convert Int16 PCM to Float32 (normalize to [-1, 1])
      const float32 = new Float32Array(audioData.length / 2);
      for (let i = 0; i < float32.length; i++) {
        // Read little-endian Int16
        const int16 = (audioData[i * 2 + 1] << 8) | audioData[i * 2];
        // Convert to signed Int16
        const signed = int16 > 32767 ? int16 - 65536 : int16;
        // Normalize to [-1, 1]
        float32[i] = signed / 32768.0;
      }

      console.log(`[AudioRecording] Converted ${float32.length} samples from WAV`);

      return float32;
    } catch (error) {
      throw new Error(`Failed to convert WAV to Float32: ${error}`);
    }
  }
}

// Singleton instance
export const audioRecordingService = new AudioRecordingService();
