import { useEffect, useState } from 'react';
import { History, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { listRecentExperience } from '@/lib/learning/experience';
import { cn } from '@/lib/utils';

export function ExperiencePanel() {
  const { user } = useAuthStore();
  const [rows, setRows] = useState<
    Array<{
      id: string;
      agent: string;
      event_type: string;
      summary: string;
      success: boolean | null;
      created_at: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    listRecentExperience(user.id, 12)
      .then(setRows)
      .catch((err) => {
        console.error('[EDUBRAIN] Experience panel', err);
        setError(err instanceof Error ? err.message : 'Unavailable');
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="card flex items-center gap-2 p-5 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading experience…
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-slate-700 p-5 text-sm text-slate-500">
        Experience log unavailable (run migration 005). {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <History className="h-4 w-4 text-brand-400" />
          Experience
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Practice attempts and agent outcomes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <History className="h-4 w-4 text-brand-400" />
        Recent experience
      </div>
      <ul className="mt-3 divide-y divide-slate-800">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start gap-3 py-2.5 text-sm">
            <span className="mt-0.5">
              {r.success === true ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : r.success === false ? (
                <XCircle className="h-4 w-4 text-red-400" />
              ) : (
                <History className="h-4 w-4 text-slate-600" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-slate-200">{r.summary}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                <span className={cn('uppercase tracking-wider')}>{r.agent}</span>
                {' · '}
                {r.event_type}
                {' · '}
                {new Date(r.created_at).toLocaleString()}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
