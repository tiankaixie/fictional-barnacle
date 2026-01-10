/**
 * Input: WhisperKit native module events
 * Output: React hook for WhisperKit functionality
 * Pos: React hook providing speech recognition interface
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, NativeModules, NativeEventEmitter, PermissionsAndroid } from 'react-native';
import { Audio } from 'expo-av';
import type {
  TranscriptionUpdateEvent,
  RecordingStateChangeEvent,
  WhisperKitModel,
  TranscriptionResult,
} from './WhisperKit.types';

// Check if native module is available
const WhisperKitModule = NativeModules.WhisperKit;
const hasNativeModule = !!WhisperKitModule;

// Mock implementation for development without native module
class MockWhisperKit {
  private isRecording = false;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  async initialize(_model?: string): Promise<boolean> {
    console.log('[MockWhisperKit] Initialized');
    return true;
  }

  async startRecording(): Promise<boolean> {
    this.isRecording = true;
    this.emit('onRecordingStateChange', { isRecording: true });

    // Simulate transcription updates
    const phrases = [
      'Hello',
      'Hello, this is',
      'Hello, this is a test',
      'Hello, this is a test of the voice recording.',
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(interval);
        return;
      }
      if (index < phrases.length) {
        this.emit('onTranscriptionUpdate', {
          text: phrases[index],
          fullText: phrases[index],
          isFinal: false,
        });
        index++;
      }
    }, 800);

    return true;
  }

  async stopRecording(): Promise<TranscriptionResult> {
    this.isRecording = false;
    this.emit('onRecordingStateChange', { isRecording: false });
    return { text: 'Hello, this is a test of the voice recording.', duration: 3200 };
  }

  getAvailableModels(): string[] {
    return ['tiny.en', 'base.en', 'small.en'];
  }

  async isModelDownloaded(_model: string): Promise<boolean> {
    return true;
  }

  async downloadModel(_model: string): Promise<boolean> {
    return true;
  }

  addListener(event: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return { remove: () => this.listeners.get(event)?.delete(callback) };
  }

  private emit(event: string, data: unknown) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }
}

const mockWhisperKit = new MockWhisperKit();

export function useWhisperKit(model: WhisperKitModel = 'base.en') {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const subscriptionsRef = useRef<Array<{ remove: () => void }>>([]);

  // Request microphone permission
  useEffect(() => {
    async function requestPermission() {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setPermissionGranted(status === 'granted');
        if (status !== 'granted') {
          setError('Microphone permission is required for voice recording');
        }
      } catch (e) {
        console.error('Permission request failed:', e);
        setError('Failed to request microphone permission');
      }
    }
    requestPermission();
  }, []);

  // Initialize WhisperKit
  useEffect(() => {
    async function initialize() {
      try {
        if (hasNativeModule) {
          console.log('[useWhisperKit] Initializing with native WhisperKit module');
          const emitter = new NativeEventEmitter(WhisperKitModule);

          const transcriptionSub = emitter.addListener(
            'onTranscriptionUpdate',
            (event: TranscriptionUpdateEvent) => {
              setLiveTranscript(event.fullText);
            }
          );

          const stateSub = emitter.addListener(
            'onRecordingStateChange',
            (event: RecordingStateChangeEvent) => {
              setIsRecording(event.isRecording);
            }
          );

          const errorSub = emitter.addListener('onError', (event: { message: string }) => {
            console.error('[useWhisperKit] Native error:', event.message);
            setError(event.message);
          });

          subscriptionsRef.current = [transcriptionSub, stateSub, errorSub];

          console.log(`[useWhisperKit] Initializing with model: ${model}`);
          const success = await WhisperKitModule.initialize(model);

          if (success) {
            console.log('[useWhisperKit] Native module initialized successfully');
            setIsInitialized(true);
          } else {
            throw new Error('Failed to initialize native WhisperKit');
          }
        } else {
          // Use mock for development/testing
          console.warn('[useWhisperKit] Native module not found, using mock implementation');
          const transcriptionSub = mockWhisperKit.addListener(
            'onTranscriptionUpdate',
            (event) => {
              const e = event as TranscriptionUpdateEvent;
              setLiveTranscript(e.fullText);
            }
          );

          const stateSub = mockWhisperKit.addListener(
            'onRecordingStateChange',
            (event) => {
              const e = event as RecordingStateChangeEvent;
              setIsRecording(e.isRecording);
            }
          );

          subscriptionsRef.current = [transcriptionSub, stateSub];

          const success = await mockWhisperKit.initialize(model);
          setIsInitialized(success);
          console.log('[useWhisperKit] Mock implementation initialized');
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to initialize WhisperKit';
        console.error('[useWhisperKit] Initialization error:', message);
        setError(message);
      }
    }

    initialize();

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.remove());
    };
  }, [model]);

  const startRecording = useCallback(async () => {
    if (!permissionGranted) {
      setError('Microphone permission not granted');
      return;
    }

    setLiveTranscript('');
    setError(null);

    try {
      if (hasNativeModule) {
        await WhisperKitModule.startRecording();
      } else {
        await mockWhisperKit.startRecording();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to start recording';
      setError(message);
    }
  }, [permissionGranted]);

  const stopRecording = useCallback(async (): Promise<TranscriptionResult> => {
    try {
      if (hasNativeModule) {
        return await WhisperKitModule.stopRecording();
      } else {
        return await mockWhisperKit.stopRecording();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to stop recording';
      setError(message);
      return { text: '', duration: 0 };
    }
  }, []);

  return {
    isInitialized,
    isRecording,
    liveTranscript,
    error,
    permissionGranted,
    startRecording,
    stopRecording,
  };
}
