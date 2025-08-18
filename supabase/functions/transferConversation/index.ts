// functions/transferConversation/index.ts
// Edge Function: transfer a conversation between owners/queues.
// - In prod: gateway enforces JWT when verify_jwt = true.
// - Locally: set ALLOW_ANON=true to bypass auth while testing.
//
// Expected POST body (customize to your app):
//   {
//     "conversationId": "c1",
//     "toAgentId": "agent_123",           // OR "toQueueId": "sales"
//     "note": "optional reason",
//     "tenantId": "t1"                    // if you need multi-tenant checks
//   }
//
// Env expected at runtime (injected by Supabase):
//   SUPABASE_URL
//   SUPABASE_ANON_KEY
//
// Optional (you set):
//   ALLOW_ANON=true   // ONLY for local dev

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, apikey, x-client-info, content-type",
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

function badRequest(msg: string, details?: unknown) {
  return json({ error: msg, details }, { status: 400 });
}

function unauthorized(msg = "Unauthorized") {
  return json({ error: msg }, { status: 401 });
}

function methodNotAllowed() {
  return json({ error: "Method not allowed" }, { status: 405 });
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  if (req.method !== "POST") return methodNotAllowed();

  const allowAnon =
    (Deno.env.get("ALLOW_ANON") ?? "false").toLowerCase() === "true";

  // Attach Authorization header to supabase-js
  const authHeader = req.headers.get("authorization") ?? "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const body = await req.json().catch(() => ({}));

    const conversationId = String(body?.conversationId ?? "");
    const toAgentId = body?.toAgentId ? String(body?.toAgentId) : "";
    const toQueueId = body?.toQueueId ? String(body?.toQueueId) : "";
    const note = body?.note ? String(body?.note) : "";
    const tenantId = body?.tenantId ? String(body?.tenantId) : "";

    if (!conversationId) return badRequest("conversationId is required");
    if (!toAgentId && !toQueueId) {
      return badRequest("Provide one of toAgentId or toQueueId");
    }

    // Resolve caller (required in prod)
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      if (!allowAnon) return unauthorized("Invalid/expired token");
    }
    if (!user && !allowAnon) return unauthorized("Missing token");

    // ---- Your business logic goes here ----
    // Example outline (pseudo-DB):
    //   1) Verify the caller has permission to move this conversation (RLS policy or RPC check).
    //   2) Update conversation owner/queue.
    //   3) Append a transfer note / audit log.
    //
    // If you use RLS, do the updates with the "supabase" client above (user-scoped).
    // If you absolutely need a service role, inject SUPABASE_SERVICE_ROLE_KEY as a Function secret
    // and create a second client ONLY for the specific write that needs it.

    // Placeholder "pretend" result:
    const result = {
      ok: true,
      conversationId,
      transferredTo: toAgentId ? { type: "agent", id: toAgentId } : { type: "queue", id: toQueueId },
      note: note || null,
      tenantId: tenantId || null,
      actor: user ? { id: user.id, email: user.email } : null,
    };

    return json(result, { status: 200 });
  } catch (err) {
    console.error("transferConversation error:", err);
    return json(
      { error: "Internal error", message: (err as Error)?.message ?? String(err) },
      { status: 500 },
    );
  }
});
