import { useMemo, useState, type FormEvent } from 'react';
import {
  Code2,
  Shield,
  ListOrdered,
  AlertTriangle,
  CheckCircle2,
  Lock,
  FolderSearch,
  Loader2,
  Star,
  GitBranch,
} from 'lucide-react';
import {
  planCodingTask,
  CODING_PERMISSIONS,
  type PermissionLevel,
  type CodingPlanStep,
} from '@/lib/coding/permissions';
import {
  inspectPublicRepo,
  summarizeTree,
  readPublicFile,
  proposeSimplePatch,
  type RepoInspection,
} from '@/lib/coding/githubInspect';
import { cn } from '@/lib/utils';
import { requestCodingPatch } from '@/lib/ai/chat';

export function CodingPage() {
  const [goal, setGoal] = useState('Add a dark-mode toggle to the settings page');
  const [repoUrl, setRepoUrl] = useState('https://github.com/pbwsantu-collab/edubrain-ai');
  const [permission, setPermission] = useState<PermissionLevel>(() => {
    const v = localStorage.getItem('edubrain_coding_permission');
    return v === 'ASSISTED' || v === 'AUTONOMOUS' || v === 'SAFE' ? v : 'SAFE';
  });
  const [plan, setPlan] = useState<CodingPlanStep[] | null>(null);
  const [inspection, setInspection] = useState<RepoInspection | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [patchText, setPatchText] = useState<string | null>(null);
  const [patchLoading, setPatchLoading] = useState(false);

  const allowed = useMemo(() => CODING_PERMISSIONS[permission], [permission]);
  const interestingFiles = useMemo(
    () => (inspection?.tree ? summarizeTree(inspection.tree, 30) : []),
    [inspection]
  );

  const handleInspect = async () => {
    if (!repoUrl.trim()) return;
    setInspecting(true);
    setInspection(null);
    setFileContent(null);
    setPatchText(null);
    try {
      setInspection(await inspectPublicRepo(repoUrl.trim()));
    } finally {
      setInspecting(false);
    }
  };

  const handleReadFile = async (path: string) => {
    setSelectedFile(path);
    setFileLoading(true);
    setFileContent(null);
    setPatchText(null);
    try {
      const result = await readPublicFile(repoUrl.trim(), path, inspection?.defaultBranch);
      if (result.error) {
        setFileContent('// Error: ' + result.error);
      } else {
        setFileContent(result.content);
        if (goal.trim()) {
          setPatchText(proposeSimplePatch(path, result.content, goal.trim()).unifiedDiff);
          setPatchLoading(true);
          try {
            const ai = await requestCodingPatch({
              goal: goal.trim(),
              path,
              fileContent: result.content,
              permission,
            });
            if (ai?.content) setPatchText(ai.content);
          } catch {
            /* keep scaffold */
          } finally {
            setPatchLoading(false);
          }
        }
      }
    } finally {
      setFileLoading(false);
    }
  };

  const handlePlan = (e?: FormEvent) => {
    e?.preventDefault();
    if (!goal.trim()) return;
    setPlan(
      planCodingTask({
        id: crypto.randomUUID(),
        goal: goal.trim(),
        repoUrl: repoUrl.trim() || undefined,
        permission,
        filesOfInterest: interestingFiles.slice(0, 15),
      })
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Coding Agent</h1>
        <p className="mt-1 text-slate-400">
          Inspect · open files · LLM patch proposal (not applied) · no silent deploy
        </p>
      </div>

      <div className="card border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-amber-100/70">
            Patches require deployed <code className="text-amber-200">ai-chat</code> + API key. Otherwise a scaffold proposal is shown. Nothing is written to the repo.
          </p>
        </div>
      </div>

      <form onSubmit={handlePlan} className="card space-y-4 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Goal</label>
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} className="input w-full resize-y" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Repository URL</label>
          <div className="flex gap-2">
            <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} className="input flex-1" />
            <button type="button" onClick={handleInspect} disabled={inspecting || !repoUrl.trim()} className="btn-secondary shrink-0">
              {inspecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSearch className="h-4 w-4" />}
              Inspect
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Permission mode</label>
          <div className="flex flex-wrap gap-2">
            {(['SAFE', 'ASSISTED', 'AUTONOMOUS'] as PermissionLevel[]).map((level) => (
              <button key={level} type="button" onClick={() => setPermission(level)} className={cn('rounded-xl border px-3 py-2 text-xs font-medium', permission === level ? 'border-brand-500 bg-brand-600/20 text-brand-300' : 'border-slate-700 text-slate-400')}>
                <span className="inline-flex items-center gap-1.5">
                  {level === 'SAFE' && <Lock className="h-3 w-3" />}
                  {level === 'ASSISTED' && <Shield className="h-3 w-3" />}
                  {level === 'AUTONOMOUS' && <Code2 className="h-3 w-3" />}
                  {level}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Allowed: {allowed.join(', ')}</p>
        </div>
        <button type="submit" className="btn-primary">
          <ListOrdered className="h-4 w-4" />
          Generate plan
        </button>
      </form>

      {inspection && (
        <section className="card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <FolderSearch className="h-4 w-4 text-brand-400" />
            Repository inspection
          </h2>
          {inspection.error ? (
            <p className="text-sm text-amber-200">{inspection.error}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="font-medium text-white">{inspection.fullName}</span>
                {inspection.language && <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{inspection.language}</span>}
                <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Star className="h-3 w-3" />{inspection.stars}</span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500"><GitBranch className="h-3 w-3" />{inspection.defaultBranch}</span>
              </div>
              {interestingFiles.length > 0 && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Key files — click to open + propose patch</div>
                  <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 p-2 font-mono text-[11px] text-slate-400">
                    {interestingFiles.map((f) => (
                      <li key={f}>
                        <button type="button" onClick={() => handleReadFile(f)} className="w-full truncate rounded px-1 py-0.5 text-left hover:bg-slate-800 hover:text-brand-300">
                          {f}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {(fileLoading || fileContent) && (
        <section className="card space-y-3 p-5">
          <h2 className="text-sm font-semibold text-white">File{selectedFile ? `: ${selectedFile}` : ''}</h2>
          {fileLoading && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>}
          {fileContent && (
            <pre className="max-h-64 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] text-slate-400 whitespace-pre-wrap">{fileContent.slice(0, 8000)}</pre>
          )}
          {(patchLoading || patchText) && (
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                Patch proposal (not applied)
                {patchLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              {patchText && (
                <pre className="max-h-64 overflow-auto rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-100/80 whitespace-pre-wrap">{patchText}</pre>
              )}
            </div>
          )}
        </section>
      )}

      {plan && (
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <ListOrdered className="h-4 w-4 text-brand-400" />
            Planned steps ({plan.length})
          </h2>
          <ol className="mt-4 space-y-3">
            {plan.map((step, i) => (
              <li key={`${step.action}-${i}`} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs text-brand-300">{step.action}</code>
                    {step.requiresConfirmation ? (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">Needs confirmation</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />Auto-ok
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
