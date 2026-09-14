import { useEffect, useState, type FormEvent } from 'react';
import { FileText, Loader2, Plus, Trash2, BookMarked } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface KnowledgeDoc {
  id: string;
  title: string;
  source_type: string;
  status: string;
  created_at: string;
  error_message: string | null;
}

export function KnowledgePage() {
  const { user } = useAuthStore();
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const { data, error: qErr } = await supabase
        .from('knowledge_documents')
        .select('id, title, source_type, status, created_at, error_message')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setDocs((data as KnowledgeDoc[]) || []);
    } catch (err: unknown) {
      console.error('[EDUBRAIN] Knowledge load', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Knowledge tables missing — run Phase 3 migration.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      const { data: doc, error: dErr } = await supabase
        .from('knowledge_documents')
        .insert({
          user_id: user.id,
          title: title.trim(),
          source_type: 'note',
          status: 'ready',
          metadata: { chars: body.length },
        })
        .select('id')
        .single();
      if (dErr) throw dErr;

      await supabase.from('knowledge_chunks').insert({
        document_id: doc.id,
        chunk_index: 0,
        content: body.trim(),
        token_count: Math.ceil(body.trim().split(/\s+/).length * 1.3),
      });

      setTitle('');
      setBody('');
      await load();
    } catch (err: unknown) {
      console.error('[EDUBRAIN] Knowledge save', err);
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this knowledge item?')) return;
    await supabase.from('knowledge_documents').delete().eq('id', id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Knowledge
        </h1>
        <p className="mt-1 text-slate-400">
          Notes and sources the AI can use — Phase 3 foundation (RAG embeddings next)
        </p>
      </div>

      <form onSubmit={handleAddNote} className="card space-y-3 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4 text-brand-400" />
          Add note
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="input w-full"
          maxLength={200}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Paste notes, definitions, or study material…"
          className="input min-h-[120px] w-full resize-y"
          rows={5}
        />
        <button type="submit" disabled={saving || !title.trim() || !body.trim()} className="btn-primary">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <BookMarked className="h-4 w-4" />
              Save to knowledge base
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="card border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      )}

      {!loading && docs.length === 0 && !error && (
        <div className="card p-8 text-center text-slate-400">
          <FileText className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3">No knowledge items yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Add a note above. PDF upload and embeddings come next.
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.id} className="card flex items-center gap-3 p-4">
            <FileText className="h-5 w-5 shrink-0 text-brand-400" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-white">{d.title}</div>
              <div className="text-xs text-slate-500">
                {d.source_type} · {d.status} ·{' '}
                {new Date(d.created_at).toLocaleDateString()}
              </div>
            </div>
            <span
              className={cn(
                'rounded px-2 py-0.5 text-[10px] uppercase tracking-wider',
                d.status === 'ready'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              )}
            >
              {d.status}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(d.id)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-red-400"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
