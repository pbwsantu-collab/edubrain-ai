import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
            ? supabase.from('mastery').select('*').eq('user_id', user.id).limit(20)
            : Promise.resolve({ data: [] }),
        ]);

        if (subjectsRes.data) setSubjects(subjectsRes.data);
        if (masteryRes.data) setMastery(masteryRes.data);
      } catch (err) {
        console.error('[EDUBRAIN] Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const avgMastery =
    mastery.length > 0
      ? Math.round((mastery.reduce((s, m) => s + Number(m.score), 0) / mastery.length) * 100)
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {greeting()}, {profile?.display_name || 'Learner'}
        </h1>
        <p className="mt-1 text-slate-400">Ready to learn something new today?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/teach"
          className="card group flex items-start gap-4 p-5 transition-all hover:border-brand-500/40 hover:bg-slate-900"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/20 text-brand-400 transition-colors group-hover:bg-brand-600 group-hover:text-white">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-white">Start Teaching Session</div>
            <p className="mt-0.5 text-sm text-slate-400">
              Chat with your AI teacher about any subject
            </p>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-400" />
        </Link>

        <div className="card flex items-start gap-4 p-5 opacity-60">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-300">Curriculum</div>
            <p className="mt-0.5 text-sm text-slate-500">Coming in Phase 2</p>
          </div>
        </div>

        <div className="card flex items-start gap-4 p-5 opacity-60">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-300">Voice Tutor</div>
            <p className="mt-0.5 text-sm text-slate-500">Coming in Phase 4</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-400">
            <Target className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Subjects</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {loading ? '\u2014' : subjects.length}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Avg Mastery</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {loading ? '\u2014' : avgMastery !== null ? `${avgMastery}%` : '\u2014'}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-400">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Concepts Tracked</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {loading ? '\u2014' : mastery.length}
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Available Subjects</h2>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-24 animate-pulse bg-slate-900/40" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-slate-400">
              No subjects loaded yet. Seed the database or they will appear after migration.
            </p>
            <Link to="/teach" className="btn-primary mt-4 inline-flex">
              Start a free-form session
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Link
                key={subject.id}
                to={`/teach?subject=${subject.slug}`}
                className="card group flex items-center gap-4 p-4 transition-all hover:border-brand-500/30 hover:bg-slate-900"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-lg">
                  {subject.icon || '\ud83d\udcda'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white group-hover:text-brand-300">
                    {subject.name}
                  </div>
                  {subject.description && (
                    <p className="truncate text-xs text-slate-500">{subject.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
