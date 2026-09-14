import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Concept {
  id: string;
  name: string;
  slug: string;
  definition: string | null;
  difficulty: string | null;
  sort_order: number;
}

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  estimated_minutes: number | null;
  sort_order: number;
  concepts: Concept[];
}

interface Chapter {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  topics: Topic[];
}

interface Unit {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  chapters: Chapter[];
}

interface CurriculumDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  grade_or_level: string | null;
  board_or_standard: string | null;
  subjects: { name: string; icon: string | null } | null;
  units: Unit[];
}

export function CurriculumDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<CurriculumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function load() {
      try {
        const { data: curr, error: cErr } = await supabase
          .from('curricula')
          .select(`
            id, name, slug, description, grade_or_level, board_or_standard,
            subjects ( name, icon ),
            units (
              id, name, slug, description, sort_order,
              chapters (
                id, name, slug, description, sort_order,
                topics (
                  id, name, slug, description, estimated_minutes, sort_order,
                  concepts ( id, name, slug, definition, difficulty, sort_order )
                )
              )
            )
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (cErr) throw cErr;
        if (!curr) {
          setError('Curriculum not found.');
          return;
        }

        const normalized = curr as unknown as CurriculumDetail;
        normalized.units = (normalized.units || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((u) => ({
            ...u,
            chapters: (u.chapters || [])
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((ch) => ({
                ...ch,
                topics: (ch.topics || [])
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((t) => ({
                    ...t,
                    concepts: (t.concepts || []).sort(
                      (a, b) => a.sort_order - b.sort_order
                    ),
                  })),
              })),
          }));

        setData(normalized);
      } catch (err: unknown) {
        console.error('[EDUBRAIN] Curriculum detail', err);
        setError(err instanceof Error ? err.message : 'Failed to load curriculum');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading curriculum…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Link to="/curriculum" className="btn-ghost inline-flex text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="card border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-200">
          {error || 'Not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <Link to="/curriculum" className="btn-ghost mb-4 inline-flex text-sm">
          <ArrowLeft className="h-4 w-4" />
          All curricula
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl">
            {data.subjects?.icon || <BookOpen className="h-6 w-6 text-brand-400" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{data.name}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {data.subjects?.name}
              {data.grade_or_level ? ` · ${data.grade_or_level}` : ''}
              {data.board_or_standard ? ` · ${data.board_or_standard}` : ''}
            </p>
            {data.description && (
              <p className="mt-2 text-sm text-slate-500">{data.description}</p>
            )}
          </div>
        </div>
      </div>

      {data.units.length === 0 && (
        <div className="card p-6 text-center text-slate-400">
          <Layers className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-2">No units in this curriculum yet.</p>
        </div>
      )}

      <div className="space-y-6">
        {data.units.map((unit) => (
          <section key={unit.id} className="card overflow-hidden">
            <div className="border-b border-slate-800 bg-slate-900/80 px-5 py-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-brand-400" />
                <h2 className="font-semibold text-white">{unit.name}</h2>
              </div>
              {unit.description && (
                <p className="mt-1 text-xs text-slate-500">{unit.description}</p>
              )}
            </div>

            <div className="divide-y divide-slate-800/80">
              {unit.chapters.map((chapter) => (
                <div key={chapter.id} className="px-5 py-4">
                  <h3 className="text-sm font-medium text-slate-200">{chapter.name}</h3>
                  {chapter.description && (
                    <p className="mt-0.5 text-xs text-slate-500">{chapter.description}</p>
                  )}

                  <ul className="mt-3 space-y-2">
                    {chapter.topics.map((topic) => (
                      <li key={topic.id}>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-white">{topic.name}</span>
                            {topic.estimated_minutes != null && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Clock className="h-3 w-3" />
                                {topic.estimated_minutes} min
                              </span>
                            )}
                          </div>
                          {topic.description && (
                            <p className="mt-1 text-xs text-slate-500">{topic.description}</p>
                          )}

                          <div className="mt-3 space-y-1.5">
                            {topic.concepts.map((concept) => (
                              <Link
                                key={concept.id}
                                to={`/learn/${concept.id}`}
                                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-brand-300"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-500/60" />
                                <span className="flex-1 truncate">{concept.name}</span>
                                {concept.difficulty && (
                                  <span className="text-[10px] uppercase tracking-wider text-slate-600">
                                    {concept.difficulty}
                                  </span>
                                )}
                                <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-brand-400" />
                              </Link>
                            ))}
                            {topic.concepts.length === 0 && (
                              <p className="px-2 text-xs text-slate-600">No concepts yet</p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                    {chapter.topics.length === 0 && (
                      <p className="text-xs text-slate-600">No topics yet</p>
                    )}
                  </ul>
                </div>
              ))}
              {unit.chapters.length === 0 && (
                <p className="px-5 py-4 text-xs text-slate-600">No chapters yet</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
