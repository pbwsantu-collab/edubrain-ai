import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { requestTeacherReply } from '@/lib/ai/chat';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

export function TeachingPage() {
  const { user, profile } = useAuthStore();
  const [searchParams] = useSearchParams();
  const subjectSlug = searchParams.get('subject');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello${profile?.display_name ? `, ${profile.display_name}` : ''}! I'm your EDUBRAIN teacher. What would you like to learn today${subjectSlug ? ` about ${subjectSlug}` : ''}?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ensureConversation = async () => {
    if (conversationId || !user) return conversationId;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: subjectSlug ? `Learning ${subjectSlug}` : 'Teaching session',
        mode: 'teaching',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[EDUBRAIN] Failed to create conversation', error);
      return null;
    }

    setConversationId(data.id);
    return data.id;
  };

  const persistMessage = async (convId: string, role: string, content: string) => {
    await supabase.from('messages').insert({
      conversation_id: convId,
      role,
      content,
    });
  };

  const generateLocalTeacherReply = (userText: string): string => {
    const lower = userText.toLowerCase();

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return "Hello! I'm ready to teach. Tell me a topic (for example: fractions, photosynthesis, present perfect tense, or Newton's laws) and I'll explain it step by step.";
    }

    if (lower.includes('fraction') || lower.includes('algebra') || lower.includes('equation')) {
      return `Great topic. Let's start with the basics.\n\n**Concept**\nA fraction represents a part of a whole. For example, 3/4 means 3 equal parts out of 4.\n\n**Example**\nIf a pizza is cut into 4 slices and you eat 3, you have eaten 3/4 of the pizza.\n\n**Quick check**\nWhat does 2/5 mean in everyday language? Reply with your answer and I'll check it.`;
    }

    if (lower.includes('photosynthesis') || lower.includes('biology')) {
      return `Let's learn photosynthesis.\n\nPlants make their own food using sunlight, carbon dioxide, and water. The process produces glucose and releases oxygen.\n\n**Simple equation**\n6CO2 + 6H2O + light -> C6H12O6 + 6O2\n\nWould you like me to explain each step, or shall we do a short quiz?`;
    }

    if (lower.includes('bengali') || lower.includes('bangla')) {
      return `Ami Banglay o shikhate pari.\n\nAjker bishoy bolun — udahoron: Present Perfect tense, ba fractions. Ami dhape dhape bujhiye debo.`;
    }

    return `I understand you want to learn about: "${userText.slice(0, 120)}${userText.length > 120 ? '...' : ''}".\n\n**Teaching approach (Phase 1)**\n1. I will break the topic into small clear steps.\n2. I will give one example.\n3. I will ask one check question.\n\nPlease confirm the exact topic and your current level (beginner / intermediate / advanced), and I will begin the lesson.\n\n*(AI Edge Function is used when deployed; otherwise this local teacher responds.)*`;
  };

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const convId = await ensureConversation();
      if (convId) {
        await persistMessage(convId, 'user', text);
      }

      const history = [...messages, userMsg]
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const aiResult = await requestTeacherReply(history, subjectSlug);
      const replyText = aiResult?.content ?? generateLocalTeacherReply(text);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: replyText,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (convId) {
        await persistMessage(convId, 'assistant', replyText);
      }
    } catch (err) {
      console.error('[EDUBRAIN] Send error', err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry — something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col lg:h-screen">
      <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/20">
          <Sparkles className="h-4 w-4 text-brand-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white">Teaching Session</h1>
          <p className="text-xs text-slate-500">
            {subjectSlug ? `Subject: ${subjectSlug}` : 'Free-form · Adaptive teacher'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3 animate-slide-up',
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  msg.role === 'user'
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-brand-600/20 text-brand-400'
                )}
              >
                {msg.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800/80 text-slate-200'
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20 text-brand-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-800/80 px-4 py-2.5 text-sm text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-slate-800 bg-slate-900/50 p-4 sm:px-6">
        <form onSubmit={handleSend} className="mx-auto flex max-w-2xl gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a question or tell me what you want to learn…"
            className="input min-h-[44px] max-h-32 flex-1 resize-none py-3"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary h-11 w-11 shrink-0 !p-0"
            aria-label="Send"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] text-slate-600">
          AI Edge Function when configured · Local teacher fallback · Conversations saved with Supabase
        </p>
      </div>
    </div>
  );
}
