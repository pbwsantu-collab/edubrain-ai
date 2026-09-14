import { supabase } from '@/lib/supabase';

export interface MasteryRow {
  id: string;
  concept_key: string;
  concept_id: string | null;
  score: number;
  confidence: number;
  evidence_count: number;
  last_assessed_at: string | null;
}

export interface RevisionItem {
  id: string;
  concept_key: string;
  concept_id: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_reviewed_at: string | null;
}

/** Fetch mastery rows for the current user, highest weakness first */
export async function fetchMastery(userId: string, limit = 20): Promise<MasteryRow[]> {
  const { data, error } = await supabase
    .from('mastery')
    .select('id, concept_key, concept_id, score, confidence, evidence_count, last_assessed_at')
    .eq('user_id', userId)
    .order('score', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data || []) as MasteryRow[];
}

/** Concepts due for revision now or earlier */
export async function fetchDueRevisions(userId: string, limit = 10): Promise<RevisionItem[]> {
  const { data, error } = await supabase
    .from('revision_items')
    .select(
      'id, concept_key, concept_id, ease_factor, interval_days, repetitions, next_review_at, last_reviewed_at'
    )
    .eq('user_id', userId)
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data || []) as RevisionItem[];
}

/**
 * Simplified SM-2 style update after a practice attempt.
 * quality: 0 (fail) .. 5 (perfect). We map boolean correct → 2 or 4.
 */
export async function upsertRevisionAfterAttempt(opts: {
  userId: string;
  conceptKey: string;
  conceptId?: string | null;
  correct: boolean;
}): Promise<void> {
  const quality = opts.correct ? 4 : 2;

  const { data: existing } = await supabase
    .from('revision_items')
    .select('*')
    .eq('user_id', opts.userId)
    .eq('concept_key', opts.conceptKey)
    .maybeSingle();

  let ease = existing ? Number(existing.ease_factor) : 2.5;
  let reps = existing ? existing.repetitions : 0;
  let interval = existing ? existing.interval_days : 1;

  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 3;
    else interval = Math.round(interval * ease);
  }

  const next = new Date();
  next.setDate(next.getDate() + interval);

  const payload = {
    user_id: opts.userId,
    concept_key: opts.conceptKey,
    concept_id: opts.conceptId ?? null,
    ease_factor: ease,
    interval_days: interval,
    repetitions: reps,
    next_review_at: next.toISOString(),
    last_reviewed_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase.from('revision_items').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('revision_items').insert(payload);
  }
}

/** Suggest next concepts: low mastery first, then due revisions */
export async function suggestNextConcepts(userId: string, limit = 5) {
  const [weak, due] = await Promise.all([
    fetchMastery(userId, limit),
    fetchDueRevisions(userId, limit),
  ]);

  const seen = new Set<string>();
  const suggestions: Array<{
    concept_key: string;
    concept_id: string | null;
    reason: 'weak' | 'due';
    score?: number;
  }> = [];

  for (const d of due) {
    if (seen.has(d.concept_key)) continue;
    seen.add(d.concept_key);
    suggestions.push({
      concept_key: d.concept_key,
      concept_id: d.concept_id,
      reason: 'due',
    });
  }
  for (const m of weak) {
    if (seen.has(m.concept_key)) continue;
    if (m.score >= 0.75) continue;
    seen.add(m.concept_key);
    suggestions.push({
      concept_key: m.concept_key,
      concept_id: m.concept_id,
      reason: 'weak',
      score: Number(m.score),
    });
  }

  return suggestions.slice(0, limit);
}
