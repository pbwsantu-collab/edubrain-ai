import { supabase } from '@/lib/supabase';

export interface RetrievedChunk {
  id: string;
  content: string;
  document_id: string;
  title?: string;
  score?: number;
  source?: 'vector' | 'keyword';
}

async function retrieveByVector(
  query: string,
  options: { userId?: string; limit?: number }
): Promise<RetrievedChunk[]> {
  const limit = options.limit ?? 5;

  const { data: embData, error: embErr } = await supabase.functions.invoke('embed-text', {
    body: { text: query.slice(0, 8000) },
  });

  if (embErr || embData?.error || embData?.fallback) {
    return [];
  }

  const embedding = embData?.embeddings?.[0];
  if (!Array.isArray(embedding) || embedding.length === 0) {
    return [];
  }

  const { data, error } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: embedding,
    match_count: limit,
    filter_user_id: options.userId ?? null,
  });

  if (error || !data?.length) {
    return [];
  }

  const docIds = [...new Set((data as Array<{ document_id: string }>).map((r) => r.document_id))];
  const { data: docs } = await supabase
    .from('knowledge_documents')
    .select('id, title')
    .in('id', docIds);

  const titleById = Object.fromEntries((docs || []).map((d) => [d.id, d.title]));

  return (data as Array<{
    id: string;
    document_id: string;
    content: string;
    similarity: number;
  }>).map((row) => ({
    id: row.id,
    document_id: row.document_id,
    content: row.content,
    title: titleById[row.document_id],
    score: row.similarity,
    source: 'vector' as const,
  }));
}

async function retrieveByKeyword(
  query: string,
  options: { userId?: string; limit?: number }
): Promise<RetrievedChunk[]> {
  const limit = options.limit ?? 5;
  const tokens = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3)
    .slice(0, 6);

  if (tokens.length === 0) return [];

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

  return chunks
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
        source: 'keyword' as const,
      };
    })
    .filter((c) => (c.score || 0) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);
}

export async function retrieveKnowledge(
  query: string,
  options: { userId?: string; limit?: number } = {}
): Promise<RetrievedChunk[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  try {
    const vectorHits = await retrieveByVector(q, options);
    if (vectorHits.length > 0) {
      return vectorHits;
    }
  } catch (err) {
    console.warn('[EDUBRAIN] vector retrieve', err);
  }

  try {
    return await retrieveByKeyword(q, options);
  } catch (err) {
    console.warn('[EDUBRAIN] keyword retrieve', err);
    return [];
  }
}

export function formatKnowledgeContext(chunks: RetrievedChunk[]): string {
  if (!chunks.length) return '';
  const blocks = chunks.map((c, i) => {
    const src = c.title ? ` (source: ${c.title})` : '';
    const mode = c.source ? ` [${c.source}]` : '';
    return `[${i + 1}]${src}${mode}\n${c.content.slice(0, 800)}`;
  });
  return (
    'Relevant notes from the student knowledge base:\n\n' +
    blocks.join('\n\n---\n\n') +
    '\n\nUse these notes when they help answer the student. Cite the source title if you use them.'
  );
}
