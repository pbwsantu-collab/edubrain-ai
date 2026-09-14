/**
 * EDUBRAIN AI — Provider Abstraction Interfaces
 * Keep the application independent of any single AI / speech vendor.
 */

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
}

export interface GenerateResult {
  content: string;
  model?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
}

export interface AIProvider {
  readonly name: string;
  generate(messages: Message[], options?: GenerateOptions): Promise<GenerateResult>;
  stream?(messages: Message[], options?: GenerateOptions): AsyncIterable<string>;
}

export interface EmbeddingProvider {
  readonly name: string;
  embed(texts: string[]): Promise<number[][]>;
  dimensions: number;
}

export interface STTOptions {
  language?: string;
  prompt?: string;
}

export interface SpeechToTextProvider {
  readonly name: string;
  transcribe(audio: Blob | ArrayBuffer, options?: STTOptions): Promise<string>;
}

export interface TTSOptions {
  voice?: string;
  speed?: number;
  language?: string;
}

export interface TextToSpeechProvider {
  readonly name: string;
  speak(text: string, options?: TTSOptions): Promise<ArrayBuffer>;
}

/** Registry for runtime selection of providers */
export interface ProviderRegistry {
  ai: AIProvider;
  embedding?: EmbeddingProvider;
  stt?: SpeechToTextProvider;
  tts?: TextToSpeechProvider;
}
