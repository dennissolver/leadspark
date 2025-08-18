// functions/bookDiscoveryCall/index.ts
// Edge Function: book a discovery call
// - In prod: gateway enforces JWT when verify_jwt = true.
// - Locally: set ALLOW_ANON=true to bypass auth while testing.
//
// Headers expected in prod calls (added automatically by supabase-js on the client):
//   Authorization: Bearer <user_access_token>
//   apikey: <sb_publishable_...>
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

  // Attach incoming Authorization (if any) so supabase-js can resolve user/session.
  const authHeader = req.headers.get("authorization") ?? "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const body = await req.json().catch(() => ({}));

    // Validate payload
    const tenantId = String(body?.tenantId ?? "");
    const conversationId = String(body?.conversationId ?? "");
    const contact = body?.contact ?? {};
    const slot = body?.slot ?? {};
    const email = String(contact?.email ?? "");
    const name = String(contact?.name ?? "");
    const start = String(slot?.start ?? "");
    const end = String(slot?.end ?? "");

    if (!tenantId) return badRequest("tenantId is required");
    if (!conversationId) return badRequest("conversationId is required");
    if (!email) return badRequest("contact.email is required");
    if (!name) return badRequest("contact.name is required");
    if (!start || Number.isNaN(Date.parse(start)))
      return badRequest("slot.start must be an ISO timestamp");
    if (!end || Number.isNaN(Date.parse(end)))
      return badRequest("slot.end must be an ISO timestamp");

    // Get the caller (if any). In prod with verify_jwt=true this should always be set.
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      // If the gateway allowed the call (e.g., local with ALLOW_ANON=true), we can still proceed.
      if (!allowAnon) return unauthorized("Invalid/expired token");
    }
    if (!user && !allowAnon) return unauthorized("Missing token");

    // ---- Your business logic goes here ----
    // Example: enqueue a booking, post to an external scheduler, and/or write to your DB.
    // This example just echoes the validated payload back with the caller info.
    //
    // If you need DB access with RLS, your policies should allow the authenticated user.
    // If you absolutely need service-level writes, create a second client with a service role
    // key stored as a Function secret (NOT in code). Prefer RLS where possible.

    const response = {
      ok: true,
      scheduled: {
        tenantId,
        conversationId,
        contact: { email, name },
        slot: { start, end },
      },
      actor: user ? { id: user.id, email: user.email } : null,
      // Add any IDs from your scheduler/DB here
    };

    return json(response, { status: 200 });
  } catch (err) {
    console.error("bookDiscoveryCall error:", err);
    return json(
      { error: "Internal error", message: (err as Error)?.message ?? String(err) },
      { status: 500 },
    );
  }
});
