// EDUBRAIN AI — ai-chat Edge Function
// Proxies chat to a configured AI provider. Secrets stay server-side.
// Deploy: supabase functions deploy ai-chat
// Secrets: OPENAI_API_KEY or ANTHROPIC_API_KEY (set via supabase secrets)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TEACHER_SYSTEM = `You are EDUBRAIN AI — a patient, clear, adaptive teacher.
- Explain concepts at the student's level.
- Ask one question at a time when checking understanding.
- Give examples and hints when needed.
- Never overwhelm beginners.
- If the student is weak on a topic, slow down and revise.
- Be encouraging but honest about mistakes.
- Support English and Bengali when requested.
- You do not have unrestricted autonomy; you teach and guide.
- Never claim a fact you are unsure about; say when you are uncertain.`;

type ChatMessage = { role: string; content: string };

async function callOpenAI(messages: ChatMessage[], apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("AI_MODEL") || "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(messages: ChatMessage[], apiKey: string) {
  const system = messages.find((m) => m.role === "system")?.content || TEACHER_SYSTEM;
  const filtered = messages.filter((m) => m.role !== "system");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("AI_MODEL") || "claude-3-5-haiku-latest",
      max_tokens: 1024,
      system,
      messages: filtered.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const userMessages: ChatMessage[] = body.messages || [];
    const subject = body.subject as string | undefined;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          TEACHER_SYSTEM +
          (subject ? `\nThe student is currently focusing on: ${subject}.` : ""),
      },
      ...userMessages.filter((m) => m.role === "user" || m.role === "assistant"),
    ];

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const provider =
      Deno.env.get("AI_PROVIDER") ||
      (openaiKey ? "openai" : anthropicKey ? "anthropic" : null);

    if (!provider) {
      return new Response(
        JSON.stringify({
          error: "No AI provider configured",
          hint: "Set OPENAI_API_KEY or ANTHROPIC_API_KEY as Supabase secrets",
          fallback: true,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let content: string;
    if (provider === "anthropic" && anthropicKey) {
      content = await callAnthropic(messages, anthropicKey);
    } else if (openaiKey) {
      content = await callOpenAI(messages, openaiKey);
    } else {
      throw new Error("Provider keys missing");
    }

    return new Response(
      JSON.stringify({
        content,
        provider,
        user_id: user.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[ai-chat]", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
