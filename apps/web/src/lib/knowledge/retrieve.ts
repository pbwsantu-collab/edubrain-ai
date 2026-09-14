import { supabase } from '@/lib/supabase';

export interface RetrievedChunk {
  id: string;
  content: string;
  document_id: string;
  title?: string;
  score?: number;
}

/**
 * Retrieve relevant knowledge chunks for a query.
 * Phase 3a: keyword / ILIKE search over chunks the user can access.
 * Phase 3b (later): replace with embedding cosine similarity via RPC.
 */
export async function retrieveKnowledge(
  query: string,
  options: { userId?: string; limit?: number } = {}
): Promise<RetrievedChunk[]> {
  const limit = options.limit ?? 5;
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const tokens = q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3)
    .slice(0, 6);

  if (tokens.length === 0) return [];

  try {
    let docsQuery = supabase
      .from('knowledge_documents')
      .select('id, title, user_id, is_public, status')
      .eq('status', 'ready')
      .limit(50);

    if (options.userId) {
      docsQuery = docsQuery.or(`user_id.eq.${options.userId},is_public.eq.true`);
    }

    const { data: docs, error: dErr } = await docsQuery;
    if (dErr) throw dErr;
    if (!docs?.length) return [];

    const docIds = docs.map((d) => d.id);
    const titleById = Object.fromEntries(docs.map((d) => [d.id, d.title]));

    const { data: chunks, error: cErr } = await supabase
      .from('knowledge_chunks')
      .select('id, document_id, content')
      .in('document_id', docIds)
      .limit(200);

    if (cErr) throw cErr;
    if (!chunks?.length) return [];

    const scored = chunks
      .map((ch) => {
        const text = (ch.content || '').toLowerCase();
        let score = 0;
        for (const t of tokens) {
          if (text.includes(t)) score += 1;
        }
        if (score > 0) score += Math.min(1, text.length / 2000);
        return {
          id: ch.id as string,
          content: ch.content as string,
          document_id: ch.document_id as string,
          title: titleById[ch.document_id as string],
          score,
        };
      })
      .filter((c) => (c.score || 0) > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

    return scored;
  } catch (err) {
    console.warn('[EDUBRAIN] retrieveKnowledge', err);
    return [];
  }
}

/** Format chunks for injection into a system/context message */
export function formatKnowledgeContext(chunks: RetrievedChunk[]): string {
  if (!chunks.length) return '';
  const blocks = chunks.map((c, i) => {
    const src = c.title ? ` (source: ${c.title})` : '';
    return `[${i + 1}]${src}\n${c.content.slice(0, 800)}`;
  });
  return (
    'Relevant notes from the student knowledge base:\n\n' +
    blocks.join('\n\n---\n\n') +
    '\n\nUse these notes when they help answer the student. Cite the source title if you use them.'
  );
}
