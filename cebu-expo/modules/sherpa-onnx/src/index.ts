import { NativeModulesProxy } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to SherpaOnnxModule.web.ts
// and on native platforms to SherpaOnnxModule.ts
import SherpaOnnxModule from './SherpaOnnxModule';

export interface RecognizerConfig {
  modelPath: string;
  tokensPath: string;
  numThreads?: number;
  sampleRate?: number;
  featureDim?: number;
  debug?: boolean;
}

export interface RecognitionResult {
  text: string;
  tokens?: string[];
  timestamps?: number[];
}

export class SherpaOnnx {
  private static recognizer: any = null;

  /**
   * Initialize the offline recognizer with model files
   */
  static async initialize(config: RecognizerConfig): Promise<void> {
    try {
      await SherpaOnnxModule.initialize({
        modelPath: config.modelPath,
        tokensPath: config.tokensPath,
        numThreads: config.numThreads || 4,
        sampleRate: config.sampleRate || 16000,
        featureDim: config.featureDim || 80,
        debug: config.debug || false,
      });
      this.recognizer = true; // Mark as initialized
    } catch (error) {
      throw new Error(`Failed to initialize SherpaOnnx: ${error}`);
    }
  }

  /**
   * Transcribe audio samples (Float32Array)
   */
  static async decode(samples: Float32Array): Promise<RecognitionResult> {
    if (!this.recognizer) {
      throw new Error('SherpaOnnx not initialized. Call initialize() first.');
    }

    try {
      // Convert Float32Array to regular array for native bridge
      const samplesArray = Array.from(samples);
      const result = await SherpaOnnxModule.decode(samplesArray);
      return result;
    } catch (error) {
      throw new Error(`Failed to decode audio: ${error}`);
    }
  }

  /**
   * Reset the recognizer state
   */
  static async reset(): Promise<void> {
    if (!this.recognizer) {
      return;
    }
    await SherpaOnnxModule.reset();
  }

  /**
   * Release recognizer resources
   */
  static async release(): Promise<void> {
    if (!this.recognizer) {
      return;
    }
    await SherpaOnnxModule.release();
    this.recognizer = null;
  }

  /**
   * Check if recognizer is initialized
   */
  static isInitialized(): boolean {
    return this.recognizer !== null;
  }
}

export default SherpaOnnx;
