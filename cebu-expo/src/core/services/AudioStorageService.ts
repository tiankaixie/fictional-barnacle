/**
 * Input: Float32 audio samples, file system operations
 * Output: Saved audio files with metadata, storage management
 * Pos: Manages audio file storage with quality settings and cleanup
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';

// FileSystem constants (type assertion needed for older type definitions)
const documentDirectory = (FileSystem as any).documentDirectory as string | null;
const cacheDirectory = (FileSystem as any).cacheDirectory as string | null;

export enum AudioQuality {
  LOW = 'low', // 32 kbps
  STANDARD = 'standard', // 64 kbps
  HIGH = 'high', // 128 kbps
}

export interface AudioQualityConfig {
  bitRate: number;
  displayName: string;
  estimatedSize: string; // Per minute of audio
}

export interface AudioFileInfo {
  path: string;
  size: number;
  format: string;
  durationMs: number;
}

export interface StorageStats {
  totalSize: number;
  fileCount: number;
  availableSpace: number;
}

/**
 * Audio storage service for managing saved recordings
 */
export class AudioStorageService {
  private readonly baseDirectory: string;
  private saveEnabled = true;
  private quality: AudioQuality = AudioQuality.STANDARD;

  // Quality configurations
  private readonly qualityConfigs: Record<AudioQuality, AudioQualityConfig> = {
    [AudioQuality.LOW]: {
      bitRate: 32000,
      displayName: '低 (32 kbps)',
      estimatedSize: '~240 KB/分钟',
    },
    [AudioQuality.STANDARD]: {
      bitRate: 64000,
      displayName: '标准 (64 kbps)',
      estimatedSize: '~480 KB/分钟',
    },
    [AudioQuality.HIGH]: {
      bitRate: 128000,
      displayName: '高 (128 kbps)',
      estimatedSize: '~960 KB/分钟',
    },
  };

  constructor() {
    // Use optional chaining in case documentDirectory is undefined
    this.baseDirectory = documentDirectory
      ? `${documentDirectory}Audio/`
      : '';
  }

  /**
   * Initialize storage directory
   */
  async initialize(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.baseDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.baseDirectory, { intermediates: true });
        console.log('[AudioStorage] Created base directory:', this.baseDirectory);
      }
    } catch (error) {
      throw new Error(`Failed to initialize audio storage: ${error}`);
    }
  }

  /**
   * Save audio samples to file
   * @param originalUri - Original recording file URI (WAV format from expo-av)
   */
  async saveAudio(
    samples: Float32Array,
    blockId: string,
    entryId: string,
    sampleRate: number = 16000,
    originalUri?: string
  ): Promise<AudioFileInfo> {
    if (!this.saveEnabled) {
      throw new Error('Audio saving is disabled');
    }

    try {
      console.log('[AudioStorage] ★★★ VERSION 3.0 - DIRECT FILE COPY FIX ★★★');

      // Create entry directory if needed
      const entryDir = `${this.baseDirectory}${entryId}/`;
      const entryDirInfo = await FileSystem.getInfoAsync(entryDir);
      if (!entryDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(entryDir, { intermediates: true });
      }

      // Generate file path - use WAV extension since we're keeping the original WAV file
      const fileName = `${blockId}.wav`;
      const filePath = `${entryDir}${fileName}`;
      const relativePath = `Audio/${entryId}/${fileName}`;

      // Calculate duration
      const durationMs = Math.floor((samples.length / sampleRate) * 1000);

      // If originalUri is provided, copy the original recording file directly
      // This is much better than re-encoding: preserves original quality and avoids format issues
      if (originalUri) {
        console.log('[AudioStorage] Copying original recording file:', originalUri);
        await FileSystem.copyAsync({
          from: originalUri,
          to: filePath,
        });
        console.log('[AudioStorage] Successfully copied to:', filePath);
      } else {
        // Fallback: convert samples to M4A (old behavior, but now correctly labeled as WAV)
        console.warn('[AudioStorage] No original URI provided, using fallback conversion');
        await this.samplesToM4A(samples, filePath, sampleRate);
      }

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

      console.log(`[AudioStorage] Saved audio: ${relativePath} (${size} bytes, ${durationMs}ms)`);

      return {
        path: relativePath,
        size,
        format: 'wav', // Changed from 'm4a' since we're keeping WAV format
        durationMs,
      };
    } catch (error) {
      throw new Error(`Failed to save audio: ${error}`);
    }
  }

  /**
   * Delete audio file
   */
  async deleteAudio(relativePath: string): Promise<void> {
    try {
      if (!documentDirectory) {
        throw new Error('Document directory not available');
      }
      const fullPath = `${documentDirectory}${relativePath}`;
      await FileSystem.deleteAsync(fullPath, { idempotent: true });
      console.log(`[AudioStorage] Deleted audio: ${relativePath}`);
    } catch (error) {
      console.error('[AudioStorage] Error deleting audio:', error);
    }
  }

  /**
   * Delete all audio files for an entry
   */
  async deleteEntryAudio(entryId: string): Promise<void> {
    try {
      const entryDir = `${this.baseDirectory}${entryId}/`;
      await FileSystem.deleteAsync(entryDir, { idempotent: true });
      console.log(`[AudioStorage] Deleted entry audio: ${entryId}`);
    } catch (error) {
      console.error('[AudioStorage] Error deleting entry audio:', error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      let totalSize = 0;
      let fileCount = 0;

      const dirInfo = await FileSystem.getInfoAsync(this.baseDirectory);
      if (dirInfo.exists) {
        const entries = await FileSystem.readDirectoryAsync(this.baseDirectory);

        for (const entryId of entries) {
          const entryDir = `${this.baseDirectory}${entryId}/`;
          const files = await FileSystem.readDirectoryAsync(entryDir);

          for (const fileName of files) {
            const filePath = `${entryDir}${fileName}`;
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            if (fileInfo.exists && 'size' in fileInfo) {
              totalSize += fileInfo.size;
              fileCount++;
            }
          }
        }
      }

      const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();

      return {
        totalSize,
        fileCount,
        availableSpace: freeDiskStorage,
      };
    } catch (error) {
      console.error('[AudioStorage] Error getting storage stats:', error);
      return {
        totalSize: 0,
        fileCount: 0,
        availableSpace: 0,
      };
    }
  }

  /**
   * Clean up old audio files (older than specified days)
   */
  async cleanup(olderThanDays: number): Promise<number> {
    try {
      let deletedCount = 0;
      const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

      const dirInfo = await FileSystem.getInfoAsync(this.baseDirectory);
      if (!dirInfo.exists) {
        return 0;
      }

      const entries = await FileSystem.readDirectoryAsync(this.baseDirectory);

      for (const entryId of entries) {
        const entryDir = `${this.baseDirectory}${entryId}/`;
        const files = await FileSystem.readDirectoryAsync(entryDir);

        for (const fileName of files) {
          const filePath = `${entryDir}${fileName}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          if (fileInfo.exists && 'modificationTime' in fileInfo) {
            const modTime = fileInfo.modificationTime * 1000; // Convert to ms
            if (modTime < cutoffTime) {
              await FileSystem.deleteAsync(filePath, { idempotent: true });
              deletedCount++;
            }
          }
        }
      }

      console.log(`[AudioStorage] Cleanup: deleted ${deletedCount} files older than ${olderThanDays} days`);
      return deletedCount;
    } catch (error) {
      console.error('[AudioStorage] Cleanup error:', error);
      return 0;
    }
  }

  /**
   * Enable or disable audio saving
   */
  setSaveEnabled(enabled: boolean): void {
    this.saveEnabled = enabled;
    console.log(`[AudioStorage] Save enabled: ${enabled}`);
  }

  /**
   * Check if audio saving is enabled
   */
  isSaveEnabled(): boolean {
    return this.saveEnabled;
  }

  /**
   * Set audio quality
   */
  setQuality(quality: AudioQuality): void {
    this.quality = quality;
    console.log(`[AudioStorage] Quality set to: ${quality}`);
  }

  /**
   * Get current quality setting
   */
  getQuality(): AudioQuality {
    return this.quality;
  }

  /**
   * Get quality configuration
   */
  getQualityConfig(quality: AudioQuality): AudioQualityConfig {
    return this.qualityConfigs[quality];
  }

  /**
   * Get all quality options
   */
  getAllQualityOptions(): Array<{ quality: AudioQuality; config: AudioQualityConfig }> {
    return Object.entries(this.qualityConfigs).map(([quality, config]) => ({
      quality: quality as AudioQuality,
      config,
    }));
  }

  /**
   * Convert Float32 samples to M4A file
   * @private
   */
  private async samplesToM4A(
    samples: Float32Array,
    outputPath: string,
    sampleRate: number
  ): Promise<void> {
    try {
      if (!cacheDirectory) {
        throw new Error('Cache directory not available');
      }
      // Create temporary WAV file
      const tempWavPath = `${cacheDirectory}temp_${Date.now()}.wav`;

      // Convert Float32 to Int16 PCM
      const int16Data = new Int16Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        int16Data[i] = Math.max(-32768, Math.min(32767, samples[i] * 32768));
      }

      // Create WAV file header
      const header = this.createWavHeader(int16Data.length * 2, sampleRate, 1, 16);

      // Combine header and audio data
      const wavData = new Uint8Array(header.length + int16Data.length * 2);
      wavData.set(header, 0);

      // Copy Int16 data to Uint8Array (little-endian)
      for (let i = 0; i < int16Data.length; i++) {
        const value = int16Data[i];
        wavData[header.length + i * 2] = value & 0xff;
        wavData[header.length + i * 2 + 1] = (value >> 8) & 0xff;
      }

      // Write WAV file
      // Convert Uint8Array to base64 in chunks to avoid stack overflow
      const chunkSize = 8192;
      let binaryString = '';
      for (let i = 0; i < wavData.length; i += chunkSize) {
        const chunk = wavData.slice(i, Math.min(i + chunkSize, wavData.length));
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binaryString);

      await FileSystem.writeAsStringAsync(tempWavPath, base64, {
        encoding: 'base64',
      });

      // Convert WAV to M4A using expo-av
      const { sound } = await Audio.Sound.createAsync(
        { uri: tempWavPath },
        { shouldPlay: false }
      );

      // For now, just copy the WAV as M4A (expo-av doesn't provide direct conversion)
      // In production, you'd use a native module or FFmpeg for proper conversion
      await FileSystem.copyAsync({
        from: tempWavPath,
        to: outputPath,
      });

      // Cleanup temp file
      await FileSystem.deleteAsync(tempWavPath, { idempotent: true });

      // Unload sound
      await sound.unloadAsync();
    } catch (error) {
      throw new Error(`Failed to convert samples to M4A: ${error}`);
    }
  }

  /**
   * Create WAV file header
   * @private
   */
  private createWavHeader(
    dataLength: number,
    sampleRate: number,
    channels: number,
    bitsPerSample: number
  ): Uint8Array {
    const header = new Uint8Array(44);
    const view = new DataView(header.buffer);

    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataLength, true); // File size - 8
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // fmt chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // Audio format (1 = PCM)
    view.setUint16(22, channels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, (sampleRate * channels * bitsPerSample) / 8, true); // Byte rate
    view.setUint16(32, (channels * bitsPerSample) / 8, true); // Block align
    view.setUint16(34, bitsPerSample, true); // Bits per sample

    // data chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataLength, true); // Data size

    return header;
  }
}

// Singleton instance
export const audioStorageService = new AudioStorageService();
