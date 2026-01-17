/**
 * Input: expo-sensevoice-asr native module
 * Output: SenseVoice ASR transcription results
 * Pos: Production ASR service using SenseVoice via sherpa-onnx
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import ExpoSenseVoiceASRModule from '../../../modules/expo-sensevoice-asr/src';
import type { RecognitionResult as NativeRecognitionResult } from '../../../modules/expo-sensevoice-asr/src';
import { RecognitionResult } from '../../types/asr';
import * as FileSystem from 'expo-file-system';

/**
 * SenseVoice ASR service using sherpa-onnx
 * Provides offline, on-device Chinese speech recognition
 */
export class SenseVoiceService {
  private static isInitialized = false;
  private static modelPath: string | null = null;

  // Model URLs for download
  private static readonly MODEL_BASE_URL = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models';
  private static readonly MODEL_NAME = 'sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17';
  private static readonly MODEL_FILES = [
    'model.onnx',
    'model.int8.onnx',
    'tokens.txt',
  ];

  /**
   * Download model if not already cached
   */
  private static async downloadModel(): Promise<string> {
    const modelDir = `${FileSystem.documentDirectory}sensevoice-models/${this.MODEL_NAME}`;

    // Check if model already exists
    const modelInfo = await FileSystem.getInfoAsync(modelDir);
    if (modelInfo.exists) {
      console.log('[SenseVoice] Model already cached:', modelDir);
      return modelDir;
    }

    // Create model directory
    await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });

    // Download model files
    console.log('[SenseVoice] Downloading model files...');

    for (const fileName of this.MODEL_FILES) {
      const url = `${this.MODEL_BASE_URL}/${this.MODEL_NAME}/${fileName}`;
      const destination = `${modelDir}/${fileName}`;

      console.log(`[SenseVoice] Downloading ${fileName}...`);

      await FileSystem.downloadAsync(url, destination);

      console.log(`[SenseVoice] Downloaded ${fileName}`);
    }

    console.log('[SenseVoice] Model download complete');
    return modelDir;
  }

  /**
   * Initialize the SenseVoice service
   * Downloads model if necessary and initializes native module
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[SenseVoice] Already initialized');
      return;
    }

    try {
      console.log('[SenseVoice] Initializing...');

      // Download model
      this.modelPath = await this.downloadModel();

      // Initialize native module
      await ExpoSenseVoiceASRModule.initialize({
        modelPath: `${this.modelPath}/model.int8.onnx`, // Use quantized model for speed
        numThreads: 2,
        provider: 'cpu',
        debug: false,
      });

      this.isInitialized = true;
      console.log('[SenseVoice] Initialized successfully');
    } catch (error) {
      console.error('[SenseVoice] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio samples
   * @param samples Float32Array of audio samples (16kHz mono)
   * @returns Recognition result with Chinese text
   */
  static async decode(samples: Float32Array): Promise<RecognitionResult> {
    if (!this.isInitialized) {
      throw new Error('SenseVoice not initialized. Call initialize() first.');
    }

    try {
      console.log(`[SenseVoice] Transcribing ${samples.length} samples...`);

      const startTime = Date.now();

      // Call native module
      const result: NativeRecognitionResult = await ExpoSenseVoiceASRModule.recognize(samples);

      const processingTime = Date.now() - startTime;

      console.log(`[SenseVoice] Transcription completed in ${processingTime}ms: "${result.text}"`);

      // Convert to common RecognitionResult format
      return {
        text: result.text,
        tokens: result.text.split(''),
        confidence: result.confidence || 1.0,
      };
    } catch (error) {
      console.error('[SenseVoice] Transcription error:', error);
      throw error;
    }
  }

  /**
   * Reset the service
   */
  static async reset(): Promise<void> {
    console.log('[SenseVoice] Reset');
    // No-op - sherpa-onnx handles state internally
  }

  /**
   * Release resources
   */
  static async release(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await ExpoSenseVoiceASRModule.release();
      this.isInitialized = false;
      console.log('[SenseVoice] Released');
    } catch (error) {
      console.error('[SenseVoice] Release error:', error);
    }
  }

  /**
   * Check if initialized and ready
   */
  static isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get service status
   */
  static async getStatus(): Promise<{ isInitialized: boolean; modelPath: string | null }> {
    try {
      const status = await ExpoSenseVoiceASRModule.getStatus();
      return {
        isInitialized: status.isInitialized,
        modelPath: status.modelPath || null,
      };
    } catch (error) {
      return {
        isInitialized: false,
        modelPath: null,
      };
    }
  }
}
