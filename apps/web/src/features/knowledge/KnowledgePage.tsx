import { useEffect, useState, type FormEvent } from 'react';
import { FileText, Loader2, Plus, Trash2, BookMarked, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { embedAndStoreChunk, splitIntoChunks } from '@/lib/knowledge/embed';

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

  const ingestText = async (docTitle: string, text: string, sourceType: string) => {
    if (!user || !text.trim()) return;
    const { data: doc, error: dErr } = await supabase
      .from('knowledge_documents')
      .insert({
        user_id: user.id,
        title: docTitle.trim().slice(0, 200),
        source_type: sourceType,
        status: 'processing',
        metadata: { chars: text.length },
      })
      .select('id')
      .single();
    if (dErr) throw dErr;

    const pieces = splitIntoChunks(text.trim());
    let embedOk = 0;
    for (let i = 0; i < pieces.length; i++) {
      const { data: chunk, error: cErr } = await supabase
        .from('knowledge_chunks')
        .insert({
          document_id: doc.id,
          chunk_index: i,
          content: pieces[i],
          token_count: Math.ceil(pieces[i].split(/\s+/).length * 1.3),
        })
        .select('id')
        .single();
      if (cErr) throw cErr;
      const emb = await embedAndStoreChunk(chunk.id, pieces[i]);
      if (emb.ok) embedOk += 1;
    }

    await supabase
      .from('knowledge_documents')
      .update({
        status: 'ready',
        metadata: { chars: text.length, chunks: pieces.length, embedded: embedOk },
      })
      .eq('id', doc.id);
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await ingestText(title.trim(), body, 'note');
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.txt') && !name.endsWith('.md') && !name.endsWith('.markdown')) {
      setError('Supported uploads: .txt and .md (PDF coming next).');
      return;
    }
    if (file.size > 1_500_000) {
      setError('File too large (max ~1.5 MB text).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const text = await file.text();
      await ingestText(
        file.name.replace(/\.[^.]+$/, ''),
        text,
        name.endsWith('.md') || name.endsWith('.markdown') ? 'markdown' : 'text'
      );
      await load();
    } catch (err: unknown) {
      console.error('[EDUBRAIN] File upload', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
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
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Knowledge</h1>
        <p className="mt-1 text-slate-400">
          Notes and text files — chunked and embedded when embed-text is deployed
        </p>
      </div>

      <form onSubmit={handleAddNote} className="card space-y-3 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4 text-brand-400" />
          Add note
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="input w-full" maxLength={200} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Paste notes…" className="input min-h-[120px] w-full resize-y" rows={5} />
        <button type="submit" disabled={saving || !title.trim() || !body.trim()} className="btn-primary">
          {saving ? (<><Loader2 className="h-4 w-4 animate-spin" />Saving…</>) : (<><BookMarked className="h-4 w-4" />Save to knowledge base</>)}
        </button>
      </form>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <label className="btn-secondary cursor-pointer inline-flex">
          <Upload className="h-4 w-4" />
          Upload .txt / .md
          <input type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" className="hidden" onChange={handleFileUpload} disabled={saving} />
        </label>
        <span className="text-xs text-slate-500">Text notes only for now · PDF later</span>
      </div>

      {error && (
        <div className="card border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">{error}</div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />Loading…
        </div>
      )}

      {!loading && docs.length === 0 && !error && (
        <div className="card p-8 text-center text-slate-400">
          <FileText className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3">No knowledge items yet.</p>
        </div>
      )}

      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.id} className="card flex items-center gap-3 p-4">
            <FileText className="h-5 w-5 shrink-0 text-brand-400" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-white">{d.title}</div>
              <div className="text-xs text-slate-500">
                {d.source_type} · {d.status} · {new Date(d.created_at).toLocaleDateString()}
              </div>
            </div>
            <span className={cn('rounded px-2 py-0.5 text-[10px] uppercase tracking-wider', d.status === 'ready' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-400')}>
              {d.status}
            </span>
            <button type="button" onClick={() => handleDelete(d.id)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-red-400" aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
