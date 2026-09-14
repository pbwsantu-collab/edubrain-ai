/**
 * Browser-native STT (Web Speech API) and TTS (speechSynthesis).
 * No API keys required. Quality varies by browser (best on Chrome/Edge).
 */

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && !!(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

type RecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }>;
}

function createRecognition(): RecognitionInstance | null {
  if (typeof window === 'undefined') return null;
  const W = window as unknown as {
    SpeechRecognition?: new () => RecognitionInstance;
    webkitSpeechRecognition?: new () => RecognitionInstance;
  };
  const Ctor = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

export interface ListenOptions {
  lang?: string;
  continuous?: boolean;
  onInterim?: (text: string) => void;
}

export function listenOnce(options: ListenOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const rec = createRecognition();
    if (!rec) {
      reject(new Error('Speech recognition not supported in this browser'));
      return;
    }

    rec.continuous = options.continuous ?? false;
    rec.interimResults = true;
    rec.lang = options.lang || 'en-US';

    let finalText = '';

    rec.onresult = (event) => {
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const piece = result[0]?.transcript || '';
        if (result.isFinal) {
          finalText += piece;
        } else {
          interim += piece;
        }
      }
      if (options.onInterim) {
        options.onInterim((finalText + interim).trim());
      }
    };

    rec.onerror = (event) => {
      reject(new Error(event.error || 'recognition error'));
    };

    rec.onend = () => {
      const text = finalText.trim();
      if (text) resolve(text);
      else reject(new Error('No speech detected'));
    };

    try {
      rec.start();
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Failed to start recognition'));
    }
  });
}

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  voiceName?: string;
}

export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisSupported()) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = options.lang || 'en-US';
    utter.rate = options.rate ?? 1;
    utter.pitch = options.pitch ?? 1;

    if (options.voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.name === options.voiceName);
      if (match) utter.voice = match;
    }

    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error('TTS error'));

    window.speechSynthesis.speak(utter);
  });
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}
