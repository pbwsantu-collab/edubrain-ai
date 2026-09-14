import { supabase } from '@/lib/supabase';

export interface EmbedResult {
  ok: boolean;
  dimensions?: number;
  model?: string;
  error?: string;
}

/**
 * Request embeddings from the embed-text Edge Function and store on a chunk.
 */
export async function embedAndStoreChunk(
  chunkId: string,
  text: string
): Promise<EmbedResult> {
  try {
    const { data, error } = await supabase.functions.invoke('embed-text', {
      body: { text },
    });

    if (error) {
      console.warn('[EDUBRAIN] embed-text invoke', error);
      return { ok: false, error: error.message };
    }

    if (data?.fallback || data?.error) {
      return {
        ok: false,
        error: data?.error || data?.hint || 'Embeddings unavailable',
      };
    }

    const embedding = data?.embeddings?.[0];
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return { ok: false, error: 'No embedding returned' };
    }

    const { error: upErr } = await supabase
      .from('knowledge_chunks')
      .update({ embedding })
      .eq('id', chunkId);

    if (upErr) {
      console.warn('[EDUBRAIN] embed store', upErr);
      return { ok: false, error: upErr.message };
    }

    return {
      ok: true,
      dimensions: data.dimensions || embedding.length,
      model: data.model,
    };
  } catch (err) {
    console.warn('[EDUBRAIN] embedAndStoreChunk', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Embed failed',
    };
  }
}

/** Simple paragraph splitter for longer notes */
export function splitIntoChunks(text: string, maxChars = 1200): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxChars) return [cleaned];

  const parts: string[] = [];
  const paragraphs = cleaned.split(/\n\s*\n/);
  let buf = '';
  for (const p of paragraphs) {
    if ((buf + '\n\n' + p).length > maxChars && buf) {
      parts.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts.length ? parts : [cleaned.slice(0, maxChars)];
}
