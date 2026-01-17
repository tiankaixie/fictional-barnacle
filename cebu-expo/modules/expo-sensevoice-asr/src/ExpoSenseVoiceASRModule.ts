/**
 * Input: Native module (Android/iOS)
 * Output: JavaScript interface for SenseVoice ASR
 * Pos: Main module file exposing native functionality
 */

import { requireNativeModule } from 'expo-modules-core';
import type { SenseVoiceConfig, RecognitionResult, ModuleStatus } from './ExpoSenseVoiceASR.types';

/**
 * Native module interface
 */
interface ExpoSenseVoiceASRNativeModule {
  /**
   * Initialize the SenseVoice recognizer with model
   */
  initialize(config: SenseVoiceConfig): Promise<void>;

  /**
   * Transcribe audio samples
   * @param samples Float32Array of audio samples (16kHz mono)
   */
  recognize(samples: Float32Array): Promise<RecognitionResult>;

  /**
   * Get module status
   */
  getStatus(): Promise<ModuleStatus>;

  /**
   * Release resources
   */
  release(): Promise<void>;
}

// Import the native module
const NativeModule: ExpoSenseVoiceASRNativeModule = requireNativeModule('ExpoSenseVoiceASR');

export default NativeModule;
