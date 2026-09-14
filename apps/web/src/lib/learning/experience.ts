import { supabase } from '@/lib/supabase';

export type ExperienceAgent = 'teacher' | 'coding' | 'research' | 'memory' | 'evaluation';

export interface ExperienceEventInput {
  agent: ExperienceAgent;
  eventType: string;
  summary: string;
  success?: boolean;
  score?: number;
  context?: Record<string, unknown>;
  lessons?: string[];
}

/** Persist an experience event for controlled self-improvement (Phase 8). */
export async function recordExperience(
  userId: string | null | undefined,
  input: ExperienceEventInput
): Promise<void> {
  if (!userId) return;
  try {
    await supabase.from('experience_events').insert({
      user_id: userId,
      agent: input.agent,
      event_type: input.eventType,
      summary: input.summary.slice(0, 2000),
      success: input.success ?? null,
      score: input.score ?? null,
      context: input.context ?? {},
      lessons: input.lessons ?? [],
    });
  } catch (err) {
    console.warn('[EDUBRAIN] recordExperience', err);
  }
}

export async function listRecentExperience(
  userId: string,
  limit = 20
): Promise<
  Array<{
    id: string;
    agent: string;
    event_type: string;
    summary: string;
    success: boolean | null;
    created_at: string;
  }>
> {
  const { data, error } = await supabase
    .from('experience_events')
    .select('id, agent, event_type, summary, success, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
