/**
 * Onboards a demo tenant and seed user via Supabase REST.
 * Usage: ts-node tools/playwright/scripts/onboardClient.ts
 */
import fetch from "node-fetch";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_KEY in env.");
  process.exit(1);
}

async function main() {
  const tenant = {
    name: "Demo Tenant",
    plan: "trial",
    created_at: new Date().toISOString(),
    agent_config: {
      company_name: "LeadSpark Demo",
      primary_llm: "gpt-4o-mini",
      min_budget: 5000,
    },
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(tenant),
  });

  if (!res.ok) {
    console.error("Failed to create tenant:", await res.text());
    process.exit(1);
  }
  const data = await res.json();
  console.log("✅ Tenant created:", data[0]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
