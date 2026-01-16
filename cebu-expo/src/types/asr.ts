/**
 * Input: None (type definitions)
 * Output: TypeScript types for ASR services
 * Pos: Shared types for ASR service interfaces
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

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
  confidence?: number;
}

export interface ASRService {
  initialize(): Promise<void>;
  decode(samples: Float32Array): Promise<RecognitionResult>;
  reset(): Promise<void>;
  release(): Promise<void>;
  isReady(): boolean;
}
