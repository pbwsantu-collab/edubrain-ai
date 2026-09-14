import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Mic,
  Volume2,
  VolumeX,
  Square,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { requestTeacherReply } from '@/lib/ai/chat';
import {
  formatKnowledgeContext,
  retrieveKnowledge,
} from '@/lib/knowledge/retrieve';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  listenOnce,
  speak,
  stopSpeaking,
} from '@/lib/speech/browser';

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
  const topicParam = searchParams.get('topic');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello${profile?.display_name ? `, ${profile.display_name}` : ''}! I'm your EDUBRAIN teacher. What would you like to learn today${
        subjectSlug ? ` about ${subjectSlug}` : topicParam ? ` about ${topicParam}` : ''
      }?`,
    },
  ]);
  const [input, setInput] = useState(topicParam ? `Teach me about ${topicParam}` : '');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voiceSupported] = useState(() => ({
    stt: isSpeechRecognitionSupported(),
    tts: isSpeechSynthesisSupported(),
  }));
  const [lastKnowledgeCount, setLastKnowledgeCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const ensureConversation = async () => {
    if (conversationId || !user) return conversationId;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: subjectSlug
          ? `Learning ${subjectSlug}`
          : topicParam
            ? `Learning ${topicParam}`
            : 'Teaching session',
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

  const generateLocalTeacherReply = (userText: string, knowledgeHint?: string): string => {
    const lower = userText.toLowerCase();
    const knowledgeBlock = knowledgeHint
      ? `\n\n**From your notes**\n${knowledgeHint.slice(0, 400)}`
      : '';

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return "Hello! I'm ready to teach. Tell me a topic (for example: fractions, photosynthesis, or Newton's laws) and I'll explain it step by step.";
    }

    if (lower.includes('fraction') || lower.includes('algebra') || lower.includes('equation')) {
      return `Great topic. Let's start with the basics.\n\n**Concept**\nA fraction represents a part of a whole. For example, ¾ means 3 equal parts out of 4.\n\n**Example**\nIf a pizza is cut into 4 slices and you eat 3, you have eaten ¾ of the pizza.\n\n**Quick check**\nWhat does ⅕ mean in everyday language? Reply with your answer and I'll check it.${knowledgeBlock}`;
    }

    if (lower.includes('photosynthesis') || lower.includes('biology')) {
      return `Let's learn photosynthesis.\n\nPlants make their own food using sunlight, carbon dioxide, and water. The process produces glucose and releases oxygen.\n\n**Simple equation**\n6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\n\nWould you like me to explain each step, or shall we do a short quiz?${knowledgeBlock}`;
    }

    if (lower.includes('bengali') || lower.includes('bangla') || lower.includes('বাংলা')) {
      return `আমি বাংলায়ো শেখাতে পারি।\n\nআজকের বিষয় বলুন — উদাহরণ: Present Perfect tense, বা ভগ্নাংশ (fractions)। আমি ধাপে ধাপে বুঝিয়ে দেব।`;
    }

    return `I understand you want to learn about: "${userText.slice(0, 120)}${
      userText.length > 120 ? '…' : ''
    }".\n\n**Teaching approach**\n1. Break the topic into clear steps.\n2. Give one example.\n3. Ask one check question.\n\nPlease confirm the exact topic and your level (beginner / intermediate / advanced).${knowledgeBlock}`;
  };

  const handleSend = async (e?: FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const text = (overrideText ?? input).trim();
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

      let knowledgeContext = '';
      let knowledgePreview = '';
      if (user) {
        const chunks = await retrieveKnowledge(text, { userId: user.id, limit: 4 });
        setLastKnowledgeCount(chunks.length);
        knowledgeContext = formatKnowledgeContext(chunks);
        if (chunks[0]) {
          knowledgePreview = chunks[0].content;
        }
      } else {
        setLastKnowledgeCount(0);
      }

      const history = [...messages, userMsg]
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const aiResult = await requestTeacherReply(history, {
        subject: subjectSlug,
        knowledgeContext: knowledgeContext || null,
      });
      const replyText =
        aiResult?.content ?? generateLocalTeacherReply(text, knowledgePreview);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: replyText,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (convId) {
        await persistMessage(convId, 'assistant', replyText);
      }

      if (autoSpeak && voiceSupported.tts) {
        try {
          const spoken = replyText.replace(/\*\*/g, '').slice(0, 500);
          await speak(spoken);
        } catch {
          /* ignore TTS errors */
        }
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

  const handleListen = async () => {
    if (!voiceSupported.stt || listening || loading) return;
    setListening(true);
    try {
      const transcript = await listenOnce({
        lang: 'en-US',
        onInterim: (t) => setInput(t),
      });
      setInput(transcript);
      await handleSend(undefined, transcript);
    } catch (err) {
      console.warn('[EDUBRAIN] STT', err);
    } finally {
      setListening(false);
    }
  };

  const handleSpeakLast = async () => {
    const last = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!last || !voiceSupported.tts) return;
    try {
      await speak(last.content.replace(/\*\*/g, '').slice(0, 600));
    } catch {
      /* ignore */
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
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/20">
            <Sparkles className="h-4 w-4 text-brand-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Teaching Session</h1>
            <p className="text-xs text-slate-500">
              {subjectSlug
                ? `Subject: ${subjectSlug}`
                : 'Free-form · Adaptive teacher'}
              {lastKnowledgeCount > 0 ? ` · ${lastKnowledgeCount} notes used` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {voiceSupported.tts && (
            <>
              <button
                type="button"
                onClick={() => setAutoSpeak((v) => !v)}
                className={cn(
                  'rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white',
                  autoSpeak && 'bg-brand-600/20 text-brand-400'
                )}
                title={autoSpeak ? 'Auto-speak on' : 'Auto-speak off'}
              >
                {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={handleSpeakLast}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Speak last reply"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => stopSpeaking()}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Stop speaking"
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            </>
          )}
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
        <form onSubmit={handleSend} className="mx-auto flex max-w-2xl gap-2">
          {voiceSupported.stt && (
            <button
              type="button"
              onClick={handleListen}
              disabled={loading || listening}
              className={cn(
                'btn-secondary h-11 w-11 shrink-0 !p-0',
                listening && 'bg-red-500/20 text-red-300 border-red-500/40'
              )}
              aria-label={listening ? 'Listening…' : 'Speak'}
              title={listening ? 'Listening…' : 'Dictate with microphone'}
            >
              {listening ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              listening
                ? 'Listening…'
                : 'Ask a question or tell me what you want to learn…'
            }
            className="input min-h-[44px] max-h-32 flex-1 resize-none py-3"
            disabled={loading || listening}
          />
          <button
            type="submit"
            disabled={loading || listening || !input.trim()}
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
          Knowledge RAG · {voiceSupported.stt ? 'Mic' : 'No mic'} ·{' '}
          {voiceSupported.tts ? 'Speak' : 'No TTS'} · AI Edge Function + local fallback
        </p>
      </div>
    </div>
  );
}
