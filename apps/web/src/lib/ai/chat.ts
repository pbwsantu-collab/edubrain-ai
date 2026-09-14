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

export interface TeacherRequestOptions {
  subject?: string | null;
  knowledgeContext?: string | null;
}

export async function requestTeacherReply(
  messages: ChatMessage[],
  options: TeacherRequestOptions | string | null = {}
): Promise<AIChatResult | null> {
  const opts: TeacherRequestOptions =
    typeof options === 'string' || options === null
      ? { subject: options }
      : options;

  try {
    const payloadMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    if (opts.knowledgeContext?.trim()) {
      payloadMessages.unshift({
        role: 'system',
        content: opts.knowledgeContext.trim(),
      });
    }

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: payloadMessages,
        subject: opts.subject || undefined,
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
