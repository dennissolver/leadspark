/**
 * Simple health check for the hosted widget script.
 * Usage: ts-node tools/playwright/scripts/healthCheckWidget.ts
 */
import fetch from "node-fetch";

const WIDGET_URL = process.env.WIDGET_URL || "http://localhost:5173";

async function main() {
  const res = await fetch(WIDGET_URL, { method: "GET" });
  if (!res.ok) {
    console.error("Widget not healthy:", res.status, await res.text());
    process.exit(1);
  }
  console.log("✅ Widget healthy:", WIDGET_URL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
