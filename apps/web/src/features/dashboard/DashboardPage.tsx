import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MasteryPanel } from '@/features/dashboard/MasteryPanel';
import {
  BookOpen,
  MessageSquare,
  TrendingUp,
  Target,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import type { Subject, Mastery } from '@/types/database';

export function DashboardPage() {
  const { profile, user } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mastery, setMastery] = useState<Mastery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [subjectsRes, masteryRes] = await Promise.all([
          supabase.from('subjects').select('*').eq('is_active', true).order('name'),
          user
            ? supabase
                .from('mastery')
                .select('*')
                .eq('user_id', user.id)
                .order('score', { ascending: true })
                .limit(5)
            : Promise.resolve({ data: [] as Mastery[] }),
        ]);
        setSubjects(subjectsRes.data || []);
        setMastery((masteryRes.data as Mastery[]) || []);
      } catch (err) {
        console.error('[EDUBRAIN] Dashboard load', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const greeting = profile?.display_name
    ? `Welcome back, ${profile.display_name}`
    : 'Welcome to EDUBRAIN';

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{greeting}</h1>
        <p className="mt-1 text-slate-400">
          Learn. Remember. Teach. Build. Improve.
        </p>
      </div>

      <MasteryPanel />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/teach"
          className="card group flex items-start gap-4 p-5 transition-all hover:border-brand-500/40 hover:bg-slate-900"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/20 text-brand-400 transition-colors group-hover:bg-brand-600 group-hover:text-white">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-white">Start teaching session</div>
            <p className="mt-0.5 text-sm text-slate-400">Ask anything — adaptive AI tutor</p>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-400" />
        </Link>

        <Link
          to="/curriculum"
          className="card group flex items-start gap-4 p-5 transition-all hover:border-brand-500/40 hover:bg-slate-900"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/20 text-brand-400 transition-colors group-hover:bg-brand-600 group-hover:text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-white">Curriculum</div>
            <p className="mt-0.5 text-sm text-slate-400">Structured courses and concepts</p>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-400" />
        </Link>

        <div className="card flex items-start gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-300">Goals</div>
            <p className="mt-0.5 text-sm text-slate-500">Coming in a later phase</p>
          </div>
        </div>
      </div>

      {!loading && subjects.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-brand-400" />
            Subjects
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {subjects.map((s) => (
              <Link
                key={s.id}
                to={`/teach?subject=${encodeURIComponent(s.slug)}`}
                className="card flex items-center gap-3 p-4 transition-all hover:border-brand-500/40 hover:bg-slate-900"
              >
                <span className="text-xl">{s.icon || '📚'}</span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{s.name}</div>
                  {s.description && (
                    <div className="truncate text-xs text-slate-500">{s.description}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && mastery.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <TrendingUp className="h-4 w-4 text-brand-400" />
            Recent mastery
          </h2>
          <div className="card divide-y divide-slate-800">
            {mastery.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="truncate text-slate-300">{m.concept_key}</span>
                <span className="ml-3 shrink-0 text-slate-500">
                  {Math.round(Number(m.score) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
