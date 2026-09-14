import { useMemo, useState, type FormEvent } from 'react';
import {
  Code2,
  Shield,
  ListOrdered,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  planCodingTask,
  CODING_PERMISSIONS,
  type PermissionLevel,
  type CodingPlanStep,
} from '@/lib/coding/permissions';
import { cn } from '@/lib/utils';

/**
 * Coding Agent UI — Phase 5 scaffold.
 * Plans tasks under SAFE / ASSISTED / AUTONOMOUS; does not execute
 * repo mutations until later phases wire GitHub + sandbox.
 */
export function CodingPage() {
  const [goal, setGoal] = useState('Add a dark-mode toggle to the settings page');
  const [repoUrl, setRepoUrl] = useState('https://github.com/pbwsantu-collab/edubrain-ai');
  const [permission, setPermission] = useState<PermissionLevel>('SAFE');
  const [plan, setPlan] = useState<CodingPlanStep[] | null>(null);

  const allowed = useMemo(() => CODING_PERMISSIONS[permission], [permission]);

  const handlePlan = (e?: FormEvent) => {
    e?.preventDefault();
    if (!goal.trim()) return;
    const steps = planCodingTask({
      id: crypto.randomUUID(),
      goal: goal.trim(),
      repoUrl: repoUrl.trim() || undefined,
      permission,
    });
    setPlan(steps);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Coding Agent
        </h1>
        <p className="mt-1 text-slate-400">
          Controlled planning only — no auto-commit or deploy without your approval
        </p>
      </div>

      <div className="card border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="font-medium text-amber-200">Phase 5 scaffold</p>
            <p className="mt-1 text-amber-100/70">
              This page generates a permission-aware plan. Repository inspection, sandbox tests,
              commits, and deploys will be wired in later steps with explicit confirmation.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handlePlan} className="card space-y-4 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Goal
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={3}
            className="input w-full resize-y"
            placeholder="Describe what the agent should build or fix…"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Repository URL (optional)
          </label>
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="input w-full"
            placeholder="https://github.com/org/repo"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Permission mode
          </label>
          <div className="flex flex-wrap gap-2">
            {(['SAFE', 'ASSISTED', 'AUTONOMOUS'] as PermissionLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setPermission(level)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                  permission === level
                    ? 'border-brand-500 bg-brand-600/20 text-brand-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {level === 'SAFE' && <Lock className="h-3 w-3" />}
                  {level === 'ASSISTED' && <Shield className="h-3 w-3" />}
                  {level === 'AUTONOMOUS' && <Code2 className="h-3 w-3" />}
                  {level}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Allowed actions: {allowed.join(', ')}
          </p>
        </div>
        <button type="submit" className="btn-primary">
          <ListOrdered className="h-4 w-4" />
          Generate plan
        </button>
      </form>

      {plan && (
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <ListOrdered className="h-4 w-4 text-brand-400" />
            Planned steps ({plan.length})
          </h2>
          <ol className="mt-4 space-y-3">
            {plan.map((step, i) => (
              <li
                key={`${step.action}-${i}`}
                className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs text-brand-300">{step.action}</code>
                    {step.requiresConfirmation ? (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">
                        Needs confirmation
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Auto-ok in mode
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-slate-500">
            Execution (read repo, propose patch, run tests) will appear here in a later phase.
            Deploy remains blocked unless mode is AUTONOMOUS and you confirm.
          </p>
        </section>
      )}
    </div>
  );
}
