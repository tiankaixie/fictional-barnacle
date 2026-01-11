/**
 * Input: None
 * Output: TypeScript type definitions for WhisperKit module
 * Pos: Type definitions for WhisperKit events and interfaces
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

export interface TranscriptionUpdateEvent {
  text: string;
  fullText: string;
  isFinal: boolean;
}

export interface RecordingStateChangeEvent {
  isRecording: boolean;
}

export interface ModelLoadProgressEvent {
  progress: number;
  model: string;
}

export interface ErrorEvent {
  message: string;
  code?: string;
}

export interface TranscriptionResult {
  text: string;
  duration: number;
}

export type WhisperKitModel =
  | 'tiny.en'
  | 'base.en'
  | 'small.en'
  | 'medium.en'
  | 'large-v3';

export interface WhisperKitModuleInterface {
  initialize(modelName?: string): Promise<boolean>;
  startRecording(): Promise<boolean>;
  stopRecording(): Promise<TranscriptionResult>;
  getAvailableModels(): string[];
  isModelDownloaded(modelName: string): Promise<boolean>;
  downloadModel(modelName: string): Promise<boolean>;
}
