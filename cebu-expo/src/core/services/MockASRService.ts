/**
 * Input: None (mock service for development)
 * Output: Mock transcription results simulating SenseVoice-Small ASR
 * Pos: Development-only service to test app flow before sherpa-onnx integration
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { RecognitionResult } from '../../types/asr';

/**
 * Mock ASR service that simulates Chinese voice transcription
 * Returns realistic Chinese sentences with varying lengths
 * Used during development before sherpa-onnx native module is ready
 */
export class MockASRService {
  private static isInitialized = false;
  private static mockTranscriptions = [
    '今天天气真好，我决定出去散步。',
    '我今天完成了一个重要的项目，感觉很有成就感。',
    '晚上和朋友们一起吃了顿饭，聊得很开心。',
    '明天要早起参加会议，需要好好准备一下。',
    '这个周末打算去爬山，希望天气晴朗。',
    '刚才看了一部很有意思的电影，推荐给大家。',
    '今天学习了一些新的知识，感觉收获很大。',
    '工作进展顺利，团队合作很愉快。',
    '最近在读一本好书，里面的观点很有启发性。',
    '今天运动了一个小时，感觉身体很舒服。',
    '和家人视频通话，聊了很久，很开心。',
    '明天计划去图书馆学习，安静的环境有助于专注。',
    '今天尝试了一个新的菜谱，味道还不错。',
    '这周的任务基本完成了，可以好好休息一下。',
    '刚才想到一个好主意，明天要记得去实现。',
  ];

  /**
   * Initialize the mock ASR service
   * Simulates model loading delay
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Simulate model loading delay (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.isInitialized = true;
    console.log('[MockASR] Initialized (using mock Chinese transcriptions)');
  }

  /**
   * Transcribe audio samples
   * @param samples Float32Array of audio samples (16kHz mono)
   * @returns Mock transcription result with Chinese text
   */
  static async decode(samples: Float32Array): Promise<RecognitionResult> {
    if (!this.isInitialized) {
      throw new Error('MockASR not initialized. Call initialize() first.');
    }

    // Calculate duration from samples (16kHz sample rate)
    const durationSeconds = samples.length / 16000;

    // Simulate transcription processing time (realistic latency)
    const processingTime = Math.min(durationSeconds * 0.5, 2000); // Max 2 seconds
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // Select a random transcription
    const randomIndex = Math.floor(Math.random() * this.mockTranscriptions.length);
    const text = this.mockTranscriptions[randomIndex];

    console.log(`[MockASR] Decoded ${samples.length} samples (${durationSeconds.toFixed(1)}s) -> "${text}"`);

    return {
      text,
      tokens: text.split(''),
      confidence: 0.85 + Math.random() * 0.15, // 0.85-1.0
    };
  }

  /**
   * Reset the mock ASR state
   */
  static async reset(): Promise<void> {
    console.log('[MockASR] Reset');
    // No-op for mock service
  }

  /**
   * Release resources
   */
  static async release(): Promise<void> {
    this.isInitialized = false;
    console.log('[MockASR] Released');
  }

  /**
   * Check if initialized
   */
  static isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Add a custom mock transcription (for testing)
   */
  static addMockTranscription(text: string): void {
    this.mockTranscriptions.push(text);
  }

  /**
   * Clear all mock transcriptions
   */
  static clearMockTranscriptions(): void {
    this.mockTranscriptions = [];
  }
}
