/**
 * EDUBRAIN AI — embed-text Edge Function (Phase 3)
 * Generates embeddings for knowledge chunks. Requires OPENAI_API_KEY secret.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const texts: string[] = Array.isArray(body.texts)
      ? body.texts
      : body.text
        ? [body.text]
        : [];

    if (!texts.length) {
      return new Response(JSON.stringify({ error: 'texts or text required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'OPENAI_API_KEY not configured',
          fallback: true,
          hint: 'Set secret: supabase secrets set OPENAI_API_KEY=sk-...',
        }),
        { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const model = Deno.env.get('EMBEDDING_MODEL') || 'text-embedding-3-small';
    const truncated = texts.map((t) => String(t).slice(0, 8000));

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, input: truncated }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: 'OpenAI embeddings failed', detail: errText }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const json = await res.json();
    const embeddings = (json.data || []).map((d: { embedding: number[] }) => d.embedding);

    return new Response(
      JSON.stringify({
        embeddings,
        model,
        dimensions: embeddings[0]?.length ?? 0,
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
