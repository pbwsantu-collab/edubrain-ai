import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, CalendarClock, Loader2, Target, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  fetchMastery,
  fetchDueRevisions,
  suggestNextConcepts,
  type MasteryRow,
  type RevisionItem,
} from '@/lib/learning/mastery';
import { cn } from '@/lib/utils';

export function MasteryPanel() {
  const { user } = useAuthStore();
  const [mastery, setMastery] = useState<MasteryRow[]>([]);
  const [due, setDue] = useState<RevisionItem[]>([]);
  const [suggestions, setSuggestions] = useState<
    Array<{ concept_key: string; concept_id: string | null; reason: 'weak' | 'due'; score?: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [m, d, s] = await Promise.all([
          fetchMastery(user!.id, 8),
          fetchDueRevisions(user!.id, 5),
          suggestNextConcepts(user!.id, 5),
        ]);
        setMastery(m);
        setDue(d);
        setSuggestions(s);
      } catch (err: unknown) {
        console.error('[EDUBRAIN] Mastery panel', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Mastery data unavailable (run Phase 2 migrations).'
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  if (loading) {
    return (
      <div className="card flex items-center gap-2 p-5 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading learning progress…
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-slate-700 p-5 text-sm text-slate-500">
        {error}
      </div>
    );
  }

  const hasData = mastery.length > 0 || due.length > 0 || suggestions.length > 0;

  if (!hasData) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Brain className="h-4 w-4 text-brand-400" />
          Learning progress
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Complete a practice exercise in Curriculum to start tracking mastery and revisions.
        </p>
        <Link to="/curriculum" className="btn-secondary mt-4 inline-flex text-sm">
          Open curriculum
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Target className="h-4 w-4 text-brand-400" />
          Recommended next
        </div>
        <ul className="mt-3 space-y-2">
          {suggestions.length === 0 && (
            <li className="text-sm text-slate-500">Nothing queued — great work.</li>
          )}
          {suggestions.map((s) => (
            <li key={s.concept_key}>
              {s.concept_id ? (
                <Link
                  to={`/learn/${s.concept_id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-sm transition-colors hover:border-brand-500/40 hover:bg-slate-900"
                >
                  <span className="truncate text-slate-200">
                    {s.concept_key.split('.').slice(-1)[0]?.replace(/_/g, ' ') || s.concept_key}
                  </span>
                  <span
                    className={cn(
                      'ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider',
                      s.reason === 'due'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-red-500/15 text-red-300'
                    )}
                  >
                    {s.reason === 'due' ? 'Review' : 'Strengthen'}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-400">
                  <span className="truncate">{s.concept_key}</span>
                  <span className="text-[10px] uppercase text-slate-600">{s.reason}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <TrendingUp className="h-4 w-4 text-brand-400" />
          Mastery
        </div>
        <ul className="mt-3 space-y-3">
          {mastery.length === 0 && (
            <li className="text-sm text-slate-500">No mastery data yet.</li>
          )}
          {mastery.map((m) => {
            const pct = Math.round(Number(m.score) * 100);
            return (
              <li key={m.id}>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate text-slate-300">
                    {m.concept_key.split('.').slice(-1)[0]?.replace(/_/g, ' ') || m.concept_key}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-brand-500' : 'bg-amber-500'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {due.length > 0 && (
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarClock className="h-4 w-4 text-brand-400" />
            Due for revision ({due.length})
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {due.map((r) =>
              r.concept_id ? (
                <Link
                  key={r.id}
                  to={`/learn/${r.concept_id}`}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20"
                >
                  {r.concept_key.split('.').slice(-1)[0]?.replace(/_/g, ' ') || r.concept_key}
                </Link>
              ) : (
                <span
                  key={r.id}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400"
                >
                  {r.concept_key}
                </span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
