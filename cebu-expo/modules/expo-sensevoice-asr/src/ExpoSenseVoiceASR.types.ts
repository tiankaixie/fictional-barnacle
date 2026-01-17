/**
 * Input: Native module bindings
 * Output: TypeScript type definitions for SenseVoice ASR
 * Pos: Type definitions for expo-sensevoice-asr module
 */

/**
 * SenseVoice model configuration
 */
export interface SenseVoiceConfig {
  /**
   * Path to the SenseVoice ONNX model
   */
  modelPath: string;

  /**
   * Number of threads for inference (default: 2)
   */
  numThreads?: number;

  /**
   * Provider for inference (cpu, gpu, etc.)
   */
  provider?: 'cpu' | 'gpu';

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Recognition result from SenseVoice
 */
export interface RecognitionResult {
  /**
   * Transcribed text
   */
  text: string;

  /**
   * Language detected (if available)
   */
  language?: string;

  /**
   * Emotion detected (if available)
   */
  emotion?: string;

  /**
   * Event detected (if available)
   */
  event?: string;

  /**
   * Confidence score (0-1)
   */
  confidence?: number;
}

/**
 * Module status
 */
export interface ModuleStatus {
  /**
   * Whether the module is initialized
   */
  isInitialized: boolean;

  /**
   * Model path if initialized
   */
  modelPath?: string;

  /**
   * Any error message
   */
  error?: string;
}
