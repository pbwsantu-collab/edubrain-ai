import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Loader2,
  XCircle,
  Send,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface Example {
  id: string;
  title: string | null;
  content: string;
  sort_order: number;
}

interface Exercise {
  id: string;
  exercise_type: string;
  prompt: string;
  options: string[] | null;
  correct_answer: unknown;
  explanation: string | null;
  difficulty: string | null;
}

interface ConceptDetail {
  id: string;
  name: string;
  slug: string;
  definition: string | null;
  explanation: string | null;
  difficulty: string | null;
  concept_key: string | null;
  topic_id: string;
  concept_examples: Example[];
}

export function ConceptLearnPage() {
  const { conceptId } = useParams<{ conceptId: string }>();
  const { user } = useAuthStore();
  const [concept, setConcept] = useState<ConceptDetail | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!conceptId) return;

    async function load() {
      try {
        const { data: c, error: cErr } = await supabase
          .from('concepts')
          .select(`
            id, name, slug, definition, explanation, difficulty, concept_key, topic_id,
            concept_examples ( id, title, content, sort_order )
          `)
          .eq('id', conceptId)
          .maybeSingle();

        if (cErr) throw cErr;
        if (!c) {
          setError('Concept not found.');
          return;
        }

        const detail = c as unknown as ConceptDetail;
        detail.concept_examples = (detail.concept_examples || []).sort(
          (a, b) => a.sort_order - b.sort_order
        );
        setConcept(detail);

        const { data: ex, error: eErr } = await supabase
          .from('exercises')
          .select('id, exercise_type, prompt, options, correct_answer, explanation, difficulty')
          .eq('concept_id', conceptId);

        if (eErr) throw eErr;

        const list = (ex || []).map((row) => ({
          ...row,
          options: Array.isArray(row.options)
            ? (row.options as string[])
            : typeof row.options === 'string'
              ? (JSON.parse(row.options) as string[])
              : null,
        })) as Exercise[];

        setExercises(list);
        if (list.length > 0) setActiveExercise(list[0]);
      } catch (err: unknown) {
        console.error('[EDUBRAIN] Concept load', err);
        setError(err instanceof Error ? err.message : 'Failed to load concept');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [conceptId]);

  const normalizeAnswer = (v: unknown): string => {
    if (v == null) return '';
    if (typeof v === 'string') return v.replace(/^"|"$/g, '');
    return String(v);
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!activeExercise || !selected || !user || submitted) return;

    setSubmitting(true);
    const correct = normalizeAnswer(activeExercise.correct_answer);
    const ok = selected.trim().toLowerCase() === correct.trim().toLowerCase();
    setIsCorrect(ok);
    setSubmitted(true);

    try {
      await supabase.from('attempts').insert({
        user_id: user.id,
        exercise_id: activeExercise.id,
        answer: selected,
        is_correct: ok,
        score: ok ? 1 : 0,
        feedback: ok
          ? 'Correct.'
          : activeExercise.explanation || 'Review the concept and try again.',
      });

      if (concept?.concept_key || concept?.id) {
        const key = concept.concept_key || concept.id;
        const { data: existing } = await supabase
          .from('mastery')
          .select('id, score, evidence_count')
          .eq('user_id', user.id)
          .eq('concept_key', key)
          .maybeSingle();

        const prevScore = existing ? Number(existing.score) : 0.3;
        const evidence = existing ? existing.evidence_count + 1 : 1;
        const nextScore = Math.min(1, Math.max(0, prevScore + (ok ? 0.15 : -0.08)));

        if (existing) {
          await supabase
            .from('mastery')
            .update({
              score: nextScore,
              evidence_count: evidence,
              confidence: Math.min(1, evidence / 10),
              last_assessed_at: new Date().toISOString(),
              concept_id: concept.id,
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('mastery').insert({
            user_id: user.id,
            concept_key: key,
            concept_id: concept.id,
            score: nextScore,
            confidence: 0.1,
            evidence_count: 1,
            last_assessed_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error('[EDUBRAIN] Attempt save', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetExercise = () => {
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading concept…
      </div>
    );
  }

  if (error || !concept) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Link to="/curriculum" className="btn-ghost inline-flex text-sm">
          <ArrowLeft className="h-4 w-4" />
          Curriculum
        </Link>
        <div className="card border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-200">
          {error || 'Not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <Link to="/curriculum" className="btn-ghost mb-4 inline-flex text-sm">
          <ArrowLeft className="h-4 w-4" />
          Curriculum
        </Link>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
          <BookOpen className="h-3.5 w-3.5" />
          Concept
          {concept.difficulty && (
            <span className="rounded bg-slate-800 px-1.5 py-0.5 normal-case">
              {concept.difficulty}
            </span>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-bold text-white">{concept.name}</h1>
      </div>

      {concept.definition && (
        <section className="card p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">Definition</h2>
          <p className="mt-2 text-slate-200 leading-relaxed">{concept.definition}</p>
        </section>
      )}

      {concept.explanation && (
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            <Lightbulb className="h-3.5 w-3.5 text-brand-400" />
            Explanation
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {concept.explanation}
          </p>
        </section>
      )}

      {concept.concept_examples.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Examples</h2>
          {concept.concept_examples.map((ex) => (
            <div key={ex.id} className="card p-4">
              {ex.title && (
                <div className="text-xs font-medium text-brand-400">{ex.title}</div>
              )}
              <p className="mt-1 text-sm text-slate-300">{ex.content}</p>
            </div>
          ))}
        </section>
      )}

      {activeExercise && (
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-white">Practice</h2>
          <p className="mt-3 text-sm text-slate-200">{activeExercise.prompt}</p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-2">
            {(activeExercise.options || []).map((opt) => {
              const showResult = submitted;
              const correctVal = normalizeAnswer(activeExercise.correct_answer);
              const isThisCorrect =
                opt.trim().toLowerCase() === correctVal.trim().toLowerCase();
              const isSelected = selected === opt;

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={submitted}
                  onClick={() => setSelected(opt)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                    isSelected && !showResult && 'border-brand-500 bg-brand-600/15 text-white',
                    !isSelected && !showResult && 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-600',
                    showResult && isThisCorrect && 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
                    showResult && isSelected && !isThisCorrect && 'border-red-500/50 bg-red-500/10 text-red-200'
                  )}
                >
                  <span className="flex-1">{opt}</span>
                  {showResult && isThisCorrect && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  )}
                  {showResult && isSelected && !isThisCorrect && (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </button>
              );
            })}

            {!submitted ? (
              <button type="submit" disabled={!selected || submitting} className="btn-primary mt-3">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Check answer
                  </>
                )}
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    isCorrect
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : 'bg-red-500/10 text-red-300'
                  )}
                >
                  {isCorrect ? 'Correct — well done.' : 'Not quite.'}
                  {activeExercise.explanation && (
                    <p className="mt-1 text-slate-400">{activeExercise.explanation}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={resetExercise} className="btn-secondary">
                    Try again
                  </button>
                  <Link
                    to={`/teach?topic=${encodeURIComponent(concept.name)}`}
                    className="btn-ghost"
                  >
                    Ask the teacher about this
                  </Link>
                </div>
              </div>
            )}
          </form>
        </section>
      )}

      {exercises.length === 0 && (
        <div className="card p-5 text-sm text-slate-500">
          No practice exercises for this concept yet. You can still{' '}
          <Link
            to={`/teach?topic=${encodeURIComponent(concept.name)}`}
            className="text-brand-400 hover:underline"
          >
            ask the AI teacher
          </Link>
          .
        </div>
      )}
    </div>
  );
}
