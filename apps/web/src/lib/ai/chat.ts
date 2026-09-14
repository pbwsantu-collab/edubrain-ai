import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatResult {
  content: string;
  provider?: string;
  usedFallback: boolean;
}

/**
 * Call the ai-chat Edge Function.
 * Falls back to null on network/config errors so the UI can use the local teacher.
 */
export async function requestTeacherReply(
  messages: ChatMessage[],
  subject?: string | null
): Promise<AIChatResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role, content: m.content })),
        subject: subject || undefined,
      },
    });

    if (error) {
      console.warn('[EDUBRAIN] ai-chat invoke error', error);
      return null;
    }

    if (data?.fallback || data?.error) {
      console.warn('[EDUBRAIN] ai-chat unavailable', data?.error || data?.hint);
      return null;
    }

    if (typeof data?.content === 'string' && data.content.trim()) {
      return {
        content: data.content.trim(),
        provider: data.provider,
        usedFallback: false,
      };
    }

    return null;
  } catch (err) {
    console.warn('[EDUBRAIN] ai-chat request failed', err);
    return null;
  }
}
