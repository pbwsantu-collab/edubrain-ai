import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Layers, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CurriculumRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  grade_or_level: string | null;
  board_or_standard: string | null;
  subject_id: string;
  subjects?: { name: string; slug: string; icon: string | null } | null;
}

export function CurriculumPage() {
  const [items, setItems] = useState<CurriculumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error: qError } = await supabase
          .from('curricula')
          .select('id, name, slug, description, grade_or_level, board_or_standard, subject_id, subjects(name, slug, icon)')
          .eq('is_active', true)
          .order('name');

        if (qError) throw qError;
        setItems((data as CurriculumRow[]) || []);
      } catch (err: unknown) {
        console.error('[EDUBRAIN] Curriculum load', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load curricula. Run Phase 2 migration if tables are missing.'
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Curriculum</h1>
        <p className="mt-1 text-slate-400">
          Structured courses, units, and concepts — Phase 2
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading curricula…
        </div>
      )}

      {error && (
        <div className="card border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-200">
          <p className="font-medium">Curriculum data unavailable</p>
          <p className="mt-1 text-amber-200/80">{error}</p>
          <p className="mt-3 text-xs text-slate-500">
            Apply migration{' '}
            <code className="rounded bg-slate-800 px-1">20260914000002_phase2_curriculum.sql</code> in
            the Supabase SQL editor, then refresh.
          </p>
          <Link to="/teach" className="btn-primary mt-4 inline-flex">
            Continue with free-form teaching
          </Link>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="card p-8 text-center">
          <Layers className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 text-slate-400">No curricula yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Run the Phase 2 migration to seed Class XI Physics demo content.
          </p>
          <Link to="/teach" className="btn-primary mt-4 inline-flex">
            Open teaching session
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link
              key={c.id}
              to={`/curriculum/${c.slug}`}
              className="card group flex flex-col gap-3 p-5 transition-all hover:border-brand-500/40 hover:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg">
                  {c.subjects?.icon || <BookOpen className="h-5 w-5 text-brand-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white group-hover:text-brand-300">
                    {c.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {c.subjects?.name}
                    {c.grade_or_level ? ` · ${c.grade_or_level}` : ''}
                  </div>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-400" />
              </div>
              {c.description && (
                <p className="line-clamp-2 text-sm text-slate-400">{c.description}</p>
              )}
              {c.board_or_standard && (
                <span className="w-fit rounded-lg bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                  {c.board_or_standard}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
